'use client';

export default function FieldChip({ chipName, themeName }: { chipName: string; themeName: string }) {
  const getStatusStyle = () => {
    switch (themeName) {
      case 'SKY':
        return 'bg-[#b2e9fb4c] text-flow-project-flow-sky';
      case 'GREEN':
        return 'bg-[#00b01c1a] text-flow-project-flow-green';
      case 'PURPLE':
        return 'bg-[#3f299d1a] text-shadcn-ui-app-primary';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle()}`}
    >
      {chipName}
    </div>
  );
}
