import SortImage from '@/components/album-sort/drag';
import { Item as ItemType } from '../../_types/types';
import { Fragment, useMemo } from 'react';
import Item from '../item';
import { SortableItem } from './sortableItem';

export default function Sorty({
  items,
  onOrderChange,
}: {
  items: ItemType[];
  onOrderChange: (newOrder: string[], items: ItemType[]) => void;
}) {
  const itemIds = useMemo(() => items.map((item) => String(item.id)), [items]);

  function findItem(itemId: string) {
    return items.find((item) => item.id === itemId);
  }

  return (
    <SortImage
      album={itemIds}
      onChange={(item) => onOrderChange(item, items)}
      render={(itemsId) =>
        itemsId.map((itemId) => {
          const item = findItem(itemId);
          if (!item) return null;
          return (
            <Fragment key={itemId}>
              <SortableItem key={itemId} id={itemId}>
                <Item item={item} />
              </SortableItem>
            </Fragment>
          );
        })
      }
    />
  );
}
