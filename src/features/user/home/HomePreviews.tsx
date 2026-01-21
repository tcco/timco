import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getSections } from '@/features/tim/current/currentApi';
import { getAllPosts } from '@/services/blogApi';
import { getImages } from '@/services/galleryApi';
import Section from '@/features/user/current/_components/section';
// import Carousel from '@/components/Carousel';
import { motion } from 'framer-motion';
import { PenTool } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function HomePreviews() {
  const { data: currentSections } = useQuery('currentSections', getSections);
  const { data: posts } = useQuery('recentPosts', async () => {
    return getAllPosts({ title: '', category: '' });
  });
  const { data: galleryImages } = useQuery('recentImages', getImages);

  const recentPosts = posts?.slice(0, 6) || [];
  
  // Randomize and take top 12 for variety
  const galleryPreview = galleryImages
    ?.map((img: any) => ({ id: img.id, img: img.img, name: img.name })) // Ensure type match
    .sort(() => 0.5 - Math.random())
    .slice(0, 12) || [];

  // Show top 3 sections (Professional, Bookshelf, Personal)
  const previewSections = currentSections?.slice(0, 3) || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 space-y-32">
      
      {/* Current Section - Vertical List */}
      <motion.section {...fadeInUp} className="space-y-8">
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <h2 className="text-4xl font-[Playfair_Display]">Current.</h2>
          <Link to="/current" className="text-sm font-medium hover:underline decoration-1 underline-offset-4">
            See all current activity &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {previewSections.map((section: any) => (
            <div key={section.id}>
              <Section section={section} limit={3} />
            </div>
          ))}
          {previewSections.length === 0 && <p className="text-gray-400">Loading current updates...</p>}
        </div>
      </motion.section>

      {/* Writing Section - Horizontal Scroll */}
      <motion.section {...fadeInUp} className="space-y-8">
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <h2 className="text-4xl font-[Playfair_Display]">Writing.</h2>
          <Link to="/blog" className="text-sm font-medium hover:underline decoration-1 underline-offset-4">
            Read all posts &rarr;
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-6 -mx-6 px-6 scrollbar-hide snap-x">
          {recentPosts.map((post: any) => {
             const titleLink = `/blog/${post.title.replaceAll(' ', '_')}`;
             return (
              <Link to={titleLink} key={post.id} className="group min-w-[300px] w-[300px] snap-start space-y-3">
                <div className="aspect-[3/2] bg-gray-100 overflow-hidden rounded-md">
                  {post.thumbnail ? (
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                       <PenTool size={48} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div>
                   <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wider">{post.category}</span>
                   </div>
                   <h3 className="text-xl font-semibold leading-tight group-hover:text-gray-600 transition-colors">
                     {post.title}
                   </h3>
                </div>
              </Link>
             )
          })}
          {recentPosts.length === 0 && <p className="text-gray-400">Loading posts...</p>}
        </div>
      </motion.section>

      {/* Pics Section - Carousel */}
      <motion.section {...fadeInUp} className="space-y-8">
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <h2 className="text-4xl font-[Playfair_Display]">Pics.</h2>
          <Link to="/gallery" className="text-sm font-medium hover:underline decoration-1 underline-offset-4">
            View full gallery &rarr;
          </Link>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-6 -mx-6 px-6 scrollbar-hide snap-x">
          {galleryPreview.length > 0 ? (
            galleryPreview.map((image) => (
              <div 
                key={image.id} 
                className="shrink-0 h-[350px] aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 snap-start"
              >
                <img 
                  src={image.img} 
                  alt={image.name || 'Gallery image'} 
                  className="w-full h-full object-cover pointer-events-none" 
                />
              </div>
            ))
          ) : (
             <div className="h-64 flex items-center justify-center bg-gray-50 text-gray-400 w-full">
               Loading gallery...
             </div>
          )}
        </div>
      </motion.section>

    </div>
  );
}
