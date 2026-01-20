import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';
import React from 'react';

export function AlbumSortItem({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute top-2 left-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="bg-white/95 p-1 rounded-md shadow-md cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-900 border border-neutral-200"
          {...attributes}
          {...listeners}
        >
          <DotsSixVertical size={22} weight="bold" />
        </div>
      </div>
      <div className="h-full w-full">
        {children ? (
          children
        ) : (
          <img
            src={id}
            alt=""
            className="w-full h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );
}
