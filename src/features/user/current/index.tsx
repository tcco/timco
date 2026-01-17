import { getSections } from '@/features/tim/current/currentApi';
import { useQuery } from 'react-query';
import Loading from '@/components/Loading';
import Section from './_components/section';
import Box from '@mui/material/Box';
import Masonry from '@mui/lab/Masonry';
import { useMediaQuery } from '@mui/material';

function MainCurrent() {
  const { data, isLoading: sectionsLoading, error } = useQuery(['sections'], {
    queryFn: getSections,
  });
  const md = useMediaQuery('(max-width:750px)');

  return (
    <div className="my-8 max-w-3xl mx-auto px-4 ">
      {sectionsLoading && <Loading size="medium" type="full" />}
      {!!error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          Error loading sections: {(error as any)?.message || 'Unknown error. Check console and Firebase Rules.'}
        </div>
      )}
      <Box>
        <Masonry columns={md ? 1 : 2} spacing={4}>
          {data?.map((section: any) => (
            <Section key={section.id} section={section} />
          )) || []}
        </Masonry>
      </Box>
    </div>
  );
}

export default MainCurrent;
