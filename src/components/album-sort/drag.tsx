import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import React from 'react';

export default function SortImage({
  album,
  onChange,
  render,
}: {
  album: string[];
  render: (items: string[]) => React.ReactNode;
  onChange: (album: string[]) => void;
}) {
  const [items, setItems] = useState(album);

  useEffect(() => {
    // Only reset if the actual items contained in the album changed (e.g. addition/deletion)
    // Or if we need to sync back from the server after a successful save
    const currentSorted = [...items].sort().join(',');
    const propSorted = [...album].sort().join(',');
    
    if (currentSorted !== propSorted) {
      setItems(album);
    }
  }, [album]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {render(items)}
      </SortableContext>
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as (typeof items)[0]);
        const newIndex = items.indexOf(over?.id as (typeof items)[0]);

        const newItems = arrayMove(items, oldIndex, newIndex);
        onChange(newItems);
        return newItems;
      });
    }
  }
}
