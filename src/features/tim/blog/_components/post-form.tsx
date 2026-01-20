import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import Drag from './drag-albums/drag';
import Calender from '@/components/date';
import Sort from './sort-albums/sort';
import Loading from '@/components/Loading';
import useDeleteThumbnail from '../_hooks/useDeleteThumbnail';

const formSchema = z.object({
  thumbnail: z.any().optional(),
  title: z.string().min(1, 'Title is required'),
  createdAt: z.string(),
  category: z.string().min(1, 'Category is required'),
  content: z.string().min(1, 'Content is required'),
  oldAlbums: z.array(z.array(z.string())).optional(),
  albums: z.any().optional(),
  uploadedAlbums: z.array(z.array(z.string())).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  defaultValues?: FormValues & { id: string };
  handleSubmit: (values: { values: FormValues; draft: boolean }) => void;
}

export default function PostForm({ handleSubmit, defaultValues }: FormProps) {
  const [draft, setDraft] = useState(false);
  const { deleteThumbnail: removeThumbnail, deletingThumbnail } = useDeleteThumbnail();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      createdAt: new Date().toISOString(),
      uploadedAlbums: [],
      oldAlbums: [],
    },
  });

  function onSubmit(values: FormValues) {
    handleSubmit({ values, draft });
  }

  const [selectedImage, setSelectedImage] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
    }
  };

  const thumbnailSrc = selectedImage || (typeof defaultValues?.thumbnail === 'string' ? defaultValues.thumbnail : '');

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field }) => (
            <FormItem className="flex flex-col sm:flex-row gap-4 border p-4 rounded-xl items-center bg-neutral-50/50">
              {thumbnailSrc && (
                <div className="relative group shrink-0 w-40 h-24 rounded-lg overflow-hidden border border-neutral-200 transition-all hover:border-neutral-300 shadow-sm">
                  {deletingThumbnail ? (
                    <div className="absolute inset-0 flex justify-center items-center bg-white/60 z-10">
                      <Loading size="small" type="self" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 hidden group-hover:flex justify-center items-center bg-black/40 z-10 transition-all">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          if (defaultValues?.id) {
                            removeThumbnail({
                              id: defaultValues.id,
                              onSuccess: () => {
                                setSelectedImage('');
                                field.onChange(undefined);
                              }
                            });
                          } else {
                            setSelectedImage('');
                            field.onChange(undefined);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                  <img
                    src={thumbnailSrc}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-grow w-full">
                <FormLabel className="text-sm font-medium text-neutral-700 mb-2 block">
                  Post Thumbnail
                </FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  className="h-10 text-sm file:text-xs file:font-semibold file:bg-neutral-100 file:border-0 file:rounded-md file:mr-4 file:hover:bg-neutral-200 cursor-pointer border-dashed"
                  onChange={(e) => {
                    handleImageChange(e);
                    field.onChange(e.target.files);
                  }}
                />
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Post title..." className="h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="createdAt"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Publication Date</FormLabel>
              <Calender
                onChange={field.onChange}
                value={field.value}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell your story..."
                  className="min-h-[300px] text-base leading-relaxed p-4"
                />
              </FormControl>
              <FormDescription className="text-xs text-neutral-500">
                Tip: use <code>//=//=//=//</code> to insert albums.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-6 border-t pt-6">
          <FormField
            control={form.control}
            name="uploadedAlbums"
            render={({ field }) => (
              <FormItem className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-200">
                <FormLabel className="text-lg font-semibold">Session Albums</FormLabel>
                <FormControl>
                  <div className="mt-2">
                    {field.value && field.value.length > 0 ? (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {field.value.map((album, index) => (
                          <li key={index} className="flex items-center gap-2 p-2 bg-white rounded-md border border-neutral-100 text-sm">
                            <span className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                              {index + 1}
                            </span>
                            Album ({album.length} photos)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-500 italic">No temporary albums uploaded.</p>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="albums"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium">Add New Albums</FormLabel>
                <Drag
                  onChange={(files) => field.onChange(files)}
                  onUpload={(newAlbumUrls) => {
                    const current = form.getValues().uploadedAlbums || [];
                    form.setValue('uploadedAlbums', [...current, newAlbumUrls]);
                  }}
                />
              </div>
            )}
          />

          {defaultValues?.oldAlbums && defaultValues.oldAlbums.length > 0 && (
            <FormField
              control={form.control}
              name="oldAlbums"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg font-semibold">Existing Albums</FormLabel>
                  <FormControl>
                    <Sort
                      albums={field.value || []}
                      postTitle={defaultValues?.title || ''}
                      onChange={(newOrder) => field.onChange(newOrder)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full border-t pt-6">
          <Button 
            type="submit" 
            className="grow w-full sm:w-auto h-11 text-base font-semibold shadow-sm transition-all active:scale-[0.98]"
            onClick={() => setDraft(false)}
          >
            Publish Post
          </Button>
          <Button
            type="submit"
            variant="outline"
            className="w-full sm:w-auto h-11 px-8 text-neutral-600 border-neutral-300 hover:bg-neutral-50"
            onClick={() => setDraft(true)}
          >
            Save as Draft
          </Button>
        </div>
      </form>
    </Form>
  );
}
