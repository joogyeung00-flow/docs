'use client';

import { cn } from '@/lib/utils';
import { useFlowSelectStore } from '@/stores/flow-select.store';
import type { FlowProject, FlowResource, FlowProjectResource } from '@flowai/shared';
import { SelectionChip } from './SelectionChip';
import { FlowResourceSelectModal } from '@/components/common/container/FlowResourceSelectModal';
import { useCallback, useMemo, useState } from 'react';

interface SelectionChipFlexProps {
  projects: FlowProject[];
  className?: string;
}

/**
 * 선택된 프로젝트 Chip 목록 (가로 스크롤)
 * - 마우스 휠: 관성 스크롤로 부드럽게 가로 스크롤
 * - 터치패드: 가로 스와이프로 스크롤
 * - 터치: 스와이프로 가로 스크롤
 */
export default function SelectionChipFlex({ projects, className }: SelectionChipFlexProps) {
  const selectedProjects = useFlowSelectStore((s) => s.selectedProjects);
  const setSelectedProjects = useFlowSelectStore((s) => s.setSelectedProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRemove = (projectId: string) => {
    setSelectedProjects(selectedProjects.filter((project) => project.projectId !== projectId));
  };

  // FlowProject[] -> FlowResource[] 변환
  const valueAsResources: FlowResource[] = useMemo(() => {
    return selectedProjects.map(
      (project): FlowProjectResource => ({
        type: 'project',
        id: project.projectId,
        name: project.title ?? project.projectId,
        colorCode: project.colorCode,
        data: project,
      }),
    );
  }, [selectedProjects]);

  // FlowResource[] -> FlowProject[] 변환 후 스토어 업데이트
  const handleValueChange = useCallback(
    (resources: FlowResource[]) => {
      const projects = resources.filter((r): r is FlowProjectResource => r.type === 'project').map((r) => r.data);
      setSelectedProjects(projects);
    },
    [setSelectedProjects],
  );

  return (
    <>
      <div
        className={cn(
          'scrollbar-styled min-w-0 cursor-pointer overflow-x-auto [scrollbar-color:transparent_transparent] [scrollbar-width:thin] hover:[scrollbar-color:rgb(209_213_219)_transparent]',
          className,
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <div className='flex min-w-fit items-center gap-2 rounded-md'>
          {projects.map((project) => (
            <SelectionChip key={project.projectId} project={project} onRemove={handleRemove} />
          ))}
        </div>
      </div>
      <FlowResourceSelectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableResources={['project']}
        value={valueAsResources}
        onValueChange={handleValueChange}
        selectionMode='multi'
        maxSelection={10}
      />
    </>
  );
}
