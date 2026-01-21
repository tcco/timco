import { getItems } from '@/features/tim/current/currentApi';
import { useQuery } from 'react-query';
import { Database } from '@/types/schema';
import Item from './item';

type Section = Database['public']['Tables']['current_sections']['Row'];
function Section({ section, limit }: { section: Section; limit?: number }) {
  const { data, isLoading } = useQuery(['section', section.id], {
    queryFn: () => getItems(section.id),
  });

  const displayData = limit ? data?.slice(0, limit) : data;

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-800 mb-3">
          {section.title}
        </h2>
      </div>
      {isLoading && 'Loading...'}
      <div className=" space-y-2">
        <ul className="grid grid-cols-1 gap-2 items-start">
          {displayData?.map((item: any) => (
            <Item key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Section;
