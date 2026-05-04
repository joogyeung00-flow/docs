/* ============================================================
 * FLOW-001 화면설계서 오버레이 엔진
 *
 * 동작:
 *  1) </body> 직전에 1줄로 로드되어 자동 초기화
 *  2) overlay.css는 <link>로, annotations.js는 <script> 태그로 동적 로드
 *     (file:// 프로토콜에서도 fetch CORS 제약 없이 동작)
 *  3) 우측 하단 토글 버튼으로 ON/OFF
 *  4) URL에 ?spec=on 이 있으면 자동 ON (캡처/공유용)
 *  5) 현재 활성 화면(.screen.active)의 어노테이션만 렌더
 *  6) DOM 변화(MutationObserver)로 화면 전환·동적 노드 변경 시 재배치
 *  7) window resize / scroll 에 따라 뱃지 위치 재계산
 *
 * 격리:
 *  - 모든 DOM은 .spec-overlay-root 컨테이너에 쌓고 spec-* prefix 클래스만 사용
 *  - 프로토타입 코드/스타일을 일절 수정하지 않음
 * ============================================================ */
(function () {
  'use strict';

  if (window.__SPEC_OVERLAY_LOADED__) return;
  window.__SPEC_OVERLAY_LOADED__ = true;

  // ─── 0) 자기 자신의 디렉터리 경로 추출 (CSS / JSON 같은 위치 가정) ───
  var SCRIPT_BASE = (function () {
    var s = document.currentScript;
    if (!s) {
      // currentScript 미지원 환경: 마지막 script 태그 fallback
      var all = document.getElementsByTagName('script');
      s = all[all.length - 1];
    }
    var src = s.src || '';
    return src.replace(/[^\/]+$/, ''); // .../docs/screen-spec/
  })();

  var CSS_URL = SCRIPT_BASE + 'overlay.css';
  var ANNOT_URL = SCRIPT_BASE + 'annotations.js';

  // ─── 1) CSS 로드 ───
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);

  // ─── 2) State ───
  var state = {
    on: false,
    annotations: null,        // { "scr-000": { title, items: [...] }, ... }
    popups: [],               // [{ id, host, visibleWhen, title, items }]
    loadError: null,          // 로드 실패 메시지 (있으면 패널에 표시)
    activeScreenId: null,
    activePopupId: null,
    activeItemNo: null,
    repositionRAF: null,
  };

  // ─── 3) 컨테이너 ───
  var root = document.createElement('div');
  root.className = 'spec-overlay-root';
  root.setAttribute('aria-hidden', 'true');
  document.body.appendChild(root);

  var badgeLayer = document.createElement('div');
  badgeLayer.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;';
  // 뱃지는 절대 위치 → body 기준 좌표 사용
  document.body.appendChild(badgeLayer);

  var highlightBox = document.createElement('div');
  highlightBox.className = 'spec-highlight-box';
  highlightBox.style.display = 'none';
  document.body.appendChild(highlightBox);

  // ─── 4) 토글 버튼 ───
  var toggle = document.createElement('button');
  toggle.className = 'spec-overlay-toggle';
  toggle.type = 'button';
  toggle.innerHTML = '📋 설계서 모드';
  toggle.addEventListener('click', function () { setOn(!state.on); });
  root.appendChild(toggle);

  // ─── 5) 사이드 패널 ───
  var panel = document.createElement('aside');
  panel.className = 'spec-panel';
  panel.innerHTML =
    '<div class="spec-panel-header">' +
      '<div>' +
        '<div class="spec-panel-title" data-role="title">화면 설계서</div>' +
        '<div class="spec-panel-meta" data-role="meta"></div>' +
      '</div>' +
      '<button class="spec-panel-close" type="button" aria-label="닫기">×</button>' +
    '</div>' +
    '<div class="spec-panel-body" data-role="body"></div>';
  root.appendChild(panel);
  panel.querySelector('.spec-panel-close').addEventListener('click', function () { setOn(false); });

  var panelTitle = panel.querySelector('[data-role="title"]');
  var panelMeta = panel.querySelector('[data-role="meta"]');
  var panelBody = panel.querySelector('[data-role="body"]');

  // ─── 6) annotations.js 로드 (script 태그 → file:// 환경 호환) ───
  function loadAnnotations() {
    return new Promise(function (resolve, reject) {
      // 캐시 무력화 위해 쿼리 파라미터 부착
      var url = ANNOT_URL + '?t=' + Date.now();
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () {
        if (window.SPEC_ANNOTATIONS && window.SPEC_ANNOTATIONS.screens) {
          state.annotations = window.SPEC_ANNOTATIONS.screens;
          state.popups = parsePopups(window.SPEC_ANNOTATIONS.popups);
          state.loadError = null;
          resolve();
        } else {
          state.loadError = 'annotations.js 가 로드됐지만 window.SPEC_ANNOTATIONS.screens 가 비어 있습니다.';
          reject(new Error(state.loadError));
        }
        s.parentNode && s.parentNode.removeChild(s);
      };
      s.onerror = function () {
        state.loadError = 'annotations.js 를 로드할 수 없습니다 (' + ANNOT_URL + '). 파일 경로를 확인하세요.';
        reject(new Error(state.loadError));
        s.parentNode && s.parentNode.removeChild(s);
      };
      document.head.appendChild(s);
    });
  }

  loadAnnotations()
    .then(function () {
      if (/[?&]spec=on\b/.test(location.search)) setOn(true);
      if (state.on) render();
    })
    .catch(function (err) {
      console.warn('[spec-overlay]', err);
      toggle.title = state.loadError || '어노테이션 로드 실패';
    });

  // ─── 7) ON/OFF 전환 ───
  function setOn(on) {
    state.on = !!on;
    toggle.classList.toggle('is-on', state.on);
    toggle.innerHTML = state.on ? '✕ 설계서 닫기' : '📋 설계서 모드';
    panel.classList.toggle('is-open', state.on);
    if (state.on) {
      render();
      attachListeners();
    } else {
      detachListeners();
      clearBadges();
      hideHighlight();
    }
  }

  // ─── 8) 활성 화면 식별 ───
  // 우선순위:
  //  1) 표시 중인 모달 (id^="scr-" 이며 .screen 클래스 없음, opacity != 0) — 가장 높은 z-index 우선
  //  2) .screen.active 페이지 화면
  //  3) 표시 중인 .screen
  function detectActiveScreen() {
    // 1) 모달 우선 (사용자가 현재 보고 있는 최상단 컨텍스트)
    var allScrs = document.querySelectorAll('[id^="scr-"]');
    var topModal = null, topZ = -Infinity;
    for (var i = 0; i < allScrs.length; i++) {
      var el = allScrs[i];
      if (!el.id) continue;
      if (el.classList.contains('screen')) continue;
      if (!isVisible(el)) continue;
      var cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) === 0) continue;
      if (cs.pointerEvents === 'none') continue;
      var z = parseInt(cs.zIndex, 10) || 0;
      if (z > topZ) { topZ = z; topModal = el; }
    }
    if (topModal) return topModal.id;

    // 2) 페이지 화면 (.screen.active)
    var actives = document.querySelectorAll('.screen.active');
    for (var k = 0; k < actives.length; k++) {
      if (actives[k].id) return actives[k].id;
    }

    // 3) 표시 중인 .screen
    var screens = document.querySelectorAll('.screen');
    for (var j = 0; j < screens.length; j++) {
      var s = screens[j];
      if (s.offsetParent !== null && s.id) return s.id;
    }
    return null;
  }

  // ─── 8-1) 팝업 정의 파싱 ───
  // 입력: { popupId: { host, visibleWhen, title, items } }
  //   - host: 부모 화면 id 문자열 또는 배열, 또는 "*" (모든 화면)
  //   - visibleWhen: 팝업이 열려있을 때만 매치되는 CSS 셀렉터 (예: "#pendingSheet.is-open")
  // 출력: [{ id, host, visibleWhen, title, items }]
  function parsePopups(popupsObj) {
    if (!popupsObj || typeof popupsObj !== 'object') return [];
    return Object.keys(popupsObj).map(function (id) {
      var p = popupsObj[id] || {};
      var host = p.host;
      if (typeof host === 'string') host = [host];
      else if (!Array.isArray(host)) host = ['*'];
      return {
        id: id,
        host: host,
        visibleWhen: p.visibleWhen,
        title: p.title || id,
        items: p.items || [],
      };
    });
  }

  // 변경 감지용: 주어진 element 가 등록된 팝업의 visibleWhen 셀렉터의 root 요소(또는 그 후손)인지 확인
  function matchesAnyPopupRoot(el) {
    if (!state.popups || !state.popups.length || !el || !el.id) return false;
    for (var i = 0; i < state.popups.length; i++) {
      var p = state.popups[i];
      if (!p.visibleWhen) continue;
      // visibleWhen 에서 ID 부분만 추출 (#foo.bar → foo)
      var m = p.visibleWhen.match(/#([\w-]+)/);
      if (m && m[1] === el.id) return true;
    }
    return false;
  }

  // ─── 8-2) 활성 팝업 식별 ───
  // 현재 화면(screenId) 위에 떠 있는 팝업을 찾는다.
  // 여러 팝업이 동시에 열려있으면 visibleWhen 으로 매치된 요소의 z-index가 가장 큰 것 우선.
  function detectActivePopup(screenId) {
    if (!state.popups || !state.popups.length) return null;
    var best = null, bestZ = -Infinity;
    for (var i = 0; i < state.popups.length; i++) {
      var p = state.popups[i];
      if (p.host.indexOf('*') < 0 && screenId && p.host.indexOf(screenId) < 0) continue;
      if (!p.visibleWhen) continue;
      var el;
      try { el = document.querySelector(p.visibleWhen); } catch (_) { continue; }
      if (!el || !isVisible(el)) continue;
      var cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) === 0) continue;
      if (cs.pointerEvents === 'none') continue;
      var z = parseInt(cs.zIndex, 10) || 0;
      if (z > bestZ) { bestZ = z; best = p; }
    }
    return best;
  }

  // ─── 9) 렌더 ───
  function render() {
    panelBody.innerHTML = '';
    clearBadges();
    hideHighlight();

    // 로드 실패 케이스
    if (state.loadError) {
      panelTitle.textContent = '어노테이션 로드 실패';
      panelMeta.textContent = '';
      var errBox = document.createElement('div');
      errBox.className = 'spec-panel-empty';
      errBox.style.textAlign = 'left';
      errBox.style.color = '#DC2626';
      errBox.innerHTML =
        '<div style="font-weight:700;margin-bottom:8px;">⚠ 로드 실패</div>' +
        '<div style="font-size:12px;line-height:1.5;color:#4B5563;">' +
          escapeHtml(state.loadError) +
        '</div>';
      panelBody.appendChild(errBox);
      return;
    }

    // 아직 로드 진행 중
    if (!state.annotations) {
      panelTitle.textContent = '로딩 중…';
      panelMeta.textContent = '';
      var loading = document.createElement('div');
      loading.className = 'spec-panel-empty';
      loading.textContent = '어노테이션을 불러오는 중입니다.';
      panelBody.appendChild(loading);
      return;
    }

    var screenId = detectActiveScreen();
    state.activeScreenId = screenId;

    // 활성 화면 위에 떠 있는 팝업 감지 (있으면 spec을 팝업의 것으로 스왑)
    var popup = detectActivePopup(screenId);
    state.activePopupId = popup ? popup.id : null;

    var screenSpec = screenId ? state.annotations[screenId] : null;
    var spec = popup || screenSpec;

    if (popup) {
      var screenTitle = screenSpec ? (screenSpec.title || screenId) : (screenId || '');
      panelTitle.textContent = screenTitle + ' › ' + (popup.title || popup.id);
      panelMeta.textContent = '#' + screenId + ' › #' + popup.id;
    } else {
      panelTitle.textContent = screenSpec ? (screenSpec.title || screenId) : '활성 화면 없음';
      panelMeta.textContent = screenId ? ('#' + screenId) : '';
    }

    if (!spec || !spec.items || !spec.items.length) {
      var empty = document.createElement('div');
      empty.className = 'spec-panel-empty';
      empty.textContent = screenId
        ? '이 화면(' + screenId + ')에 등록된 어노테이션이 없습니다.'
        : '활성 화면을 찾지 못했습니다. 시나리오 모달을 닫고 다시 시도해 주세요.';
      panelBody.appendChild(empty);
      return;
    }

    spec.items.forEach(function (item) {
      var target = resolveTarget(screenId, item);
      var missing = !target;

      // 패널 카드
      var card = document.createElement('div');
      card.className = 'spec-item' + (missing ? ' is-missing' : '');
      card.dataset.no = String(item.no);
      card.innerHTML =
        '<div class="spec-item-no">' + escapeHtml(String(item.no)) + '</div>' +
        '<div class="spec-item-content">' +
          '<div class="spec-item-title">' + escapeHtml(item.title || '') +
            (missing ? '<span class="spec-item-missing-tag">셀렉터 미발견</span>' : '') +
          '</div>' +
          '<div class="spec-item-desc">' + renderDesc(item.desc || '') + '</div>' +
        '</div>';
      card.addEventListener('mouseenter', function () { focusItem(item.no, false); });
      card.addEventListener('mouseleave', function () { blurItem(); });
      card.addEventListener('click', function () { focusItem(item.no, true); });
      panelBody.appendChild(card);

      if (!target) return;

      // 뱃지
      var badge = document.createElement('span');
      badge.className = 'spec-badge';
      badge.dataset.no = String(item.no);
      badge.textContent = String(item.no);
      badge.addEventListener('mouseenter', function () { focusItem(item.no, false); });
      badge.addEventListener('mouseleave', function () { blurItem(); });
      badge.addEventListener('click', function () { focusItem(item.no, true); });
      badgeLayer.appendChild(badge);
      positionBadge(badge, target, item.anchor || 'top-left');
    });
  }

  // ─── 10) 셀렉터 해석 ───
  function resolveTarget(screenId, item) {
    if (!item.selector) return null;
    var sel = item.selector;
    // selector가 ID(#xxx)로 시작하면 document 전역 탐색,
    // 아니면 활성 화면 안에서 탐색 (반응형 모바일/PC 분기 대응)
    var scope = document;
    if (sel.charAt(0) !== '#' && screenId) {
      scope = document.getElementById(screenId) || document;
    }
    try {
      var el = scope.querySelector(sel);
      if (!el) return null;
      // 화면에 실제로 표시되는 요소인지 확인 (반응형 lg:hidden 등 대응)
      if (!isVisible(el)) {
        // 같은 selector로 표시되는 다른 매치를 시도
        var all = scope.querySelectorAll(sel);
        for (var i = 0; i < all.length; i++) {
          if (isVisible(all[i])) return all[i];
        }
        return null;
      }
      return el;
    } catch (_) { return null; }
  }

  function isVisible(el) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  // ─── 11) 뱃지 위치 계산 ───
  function positionBadge(badge, target, anchor) {
    var rect = target.getBoundingClientRect();
    var top = rect.top + window.scrollY;
    var left = rect.left + window.scrollX;
    var w = rect.width, h = rect.height;
    var x = left, y = top;
    switch (anchor) {
      case 'top-right':    x = left + w; y = top; break;
      case 'bottom-left':  x = left;     y = top + h; break;
      case 'bottom-right': x = left + w; y = top + h; break;
      case 'center':       x = left + w/2; y = top + h/2; break;
      case 'top-left':
      default:             x = left;     y = top; break;
    }
    badge.style.top = y + 'px';
    badge.style.left = x + 'px';
  }

  function getActiveSpec() {
    if (!state.annotations) return null;
    if (state.activePopupId) {
      for (var i = 0; i < state.popups.length; i++) {
        if (state.popups[i].id === state.activePopupId) return state.popups[i];
      }
    }
    return state.activeScreenId ? state.annotations[state.activeScreenId] : null;
  }

  function repositionAllBadges() {
    if (!state.on || !state.annotations) return;
    var spec = getActiveSpec();
    if (!spec || !spec.items) return;
    var screenId = state.activeScreenId;
    var badges = badgeLayer.querySelectorAll('.spec-badge');
    badges.forEach(function (b) {
      var no = b.dataset.no;
      var item = spec.items.find(function (it) { return String(it.no) === no; });
      if (!item) return;
      var t = resolveTarget(screenId, item);
      if (t) positionBadge(b, t, item.anchor || 'top-left');
    });
    // 활성 강조 박스도 재계산
    if (state.activeItemNo != null) {
      var activeItem = spec.items.find(function (it) { return String(it.no) === String(state.activeItemNo); });
      if (activeItem) {
        var at = resolveTarget(screenId, activeItem);
        if (at) showHighlight(at);
      }
    }
  }

  function scheduleReposition() {
    if (state.repositionRAF) return;
    state.repositionRAF = requestAnimationFrame(function () {
      state.repositionRAF = null;
      repositionAllBadges();
    });
  }

  // ─── 12) 강조/포커스 ───
  function focusItem(no, scrollIntoView) {
    state.activeItemNo = no;
    var screenId = state.activeScreenId;
    var spec = getActiveSpec();
    if (!spec) return;
    var item = spec.items.find(function (it) { return String(it.no) === String(no); });
    if (!item) return;
    var target = resolveTarget(screenId, item);

    // 뱃지·카드 활성 토글
    badgeLayer.querySelectorAll('.spec-badge').forEach(function (b) {
      b.classList.toggle('is-active', String(b.dataset.no) === String(no));
    });
    panelBody.querySelectorAll('.spec-item').forEach(function (c) {
      c.classList.toggle('is-active', String(c.dataset.no) === String(no));
    });

    if (target) {
      showHighlight(target);
      if (scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      hideHighlight();
    }
  }

  function blurItem() {
    // hover-out: 마지막 클릭된 항목이 있으면 강조 유지, 없으면 해제
    if (state.activeItemNo == null) hideHighlight();
  }

  function showHighlight(target) {
    var rect = target.getBoundingClientRect();
    highlightBox.style.display = 'block';
    highlightBox.style.top = (rect.top + window.scrollY) + 'px';
    highlightBox.style.left = (rect.left + window.scrollX) + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
  }

  function hideHighlight() {
    highlightBox.style.display = 'none';
  }

  function clearBadges() {
    while (badgeLayer.firstChild) badgeLayer.removeChild(badgeLayer.firstChild);
    state.activeItemNo = null;
  }

  // ─── 13) 변경 감지 ───
  var mo = null;
  function attachListeners() {
    window.addEventListener('resize', scheduleReposition);
    window.addEventListener('scroll', scheduleReposition, true);
    mo = new MutationObserver(function (mutations) {
      // 화면 전환(.screen.active) 또는 모달 open/close (id^="scr-" 클래스 변경) 시 재렌더
      var needRerender = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'class') {
          var t = m.target;
          if (!t) continue;
          if (t.classList && t.classList.contains('screen')) { needRerender = true; break; }
          if (t.id && /^scr-/.test(t.id)) { needRerender = true; break; }
          // 등록된 팝업 root(또는 그 후손)인지 확인
          if (matchesAnyPopupRoot(t)) { needRerender = true; break; }
        }
        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
          scheduleReposition();
        }
      }
      if (needRerender) render();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  }

  function detachListeners() {
    window.removeEventListener('resize', scheduleReposition);
    window.removeEventListener('scroll', scheduleReposition, true);
    if (mo) { mo.disconnect(); mo = null; }
  }

  // ─── 14) 유틸 ───
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // 마크다운 링크 [text](url) 만 안전하게 변환, 나머지는 escape
  function renderDesc(text) {
    var escaped = escapeHtml(text);
    return escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>';
    });
  }

  // 외부에서 강제 새로고침할 수 있게 노출 (개발 편의용)
  window.SpecOverlay = {
    reload: function () {
      return loadAnnotations().then(function () { if (state.on) render(); });
    },
    on: function () { setOn(true); },
    off: function () { setOn(false); },
  };
})();
