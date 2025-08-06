'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { analyzePortfolioAction } from '@/app/actions';
import type { PortfolioAnalysisOutput } from '@/ai/flows/portfolio-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { AnalysisReport } from './analysis-report';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  portfolioData: z.string().min(10, 'Por favor, proporciona datos detallados del portafolio.'),
  portfolioImages: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, 'Por favor, sube al menos una imagen de tu portafolio.'),
});

type FormValues = z.infer<typeof formSchema>;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function PortfolioAnalysisForm() {
  const [analysisResult, setAnalysisResult] = useState<PortfolioAnalysisOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portfolioData: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      setAnalysisResult(null);

      if (!values.portfolioImages) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Por favor, sube al menos una imagen.',
        });
        return;
      }
      
      const imageFiles = Array.from(values.portfolioImages);
      try {
        const imagePromises = imageFiles.map(fileToBase64);
        const portfolioImages = await Promise.all(imagePromises);

        const result = await analyzePortfolioAction({
          portfolioData: values.portfolioData,
          portfolioImages,
        });

        if (result.success) {
          setAnalysisResult(result.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Análisis Fallido',
            description: result.error,
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error procesando imágenes',
          description: 'No se pudieron subir las imágenes. Por favor, inténtalo de nuevo.',
        });
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const previewUrls = fileArray.map(file => URL.createObjectURL(file));
      setUploadedImagePreviews(previewUrls);
      form.setValue('portfolioImages', files);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            Análisis de Portafolio con IA
          </CardTitle>
          <CardDescription>
            Sube los datos y capturas de pantalla de tu portafolio para recibir un análisis experto y recomendaciones estratégicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="portfolioData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datos del Portafolio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Pega aquí los datos de tu portafolio. Incluye tickers de acciones, cantidades, precios de compra y cualquier otra información relevante."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visuales del Portafolio</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                    <p className="text-xs text-muted-foreground">Tablas, gráficos o resúmenes de rendimiento</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handleImageChange} />
                            </label>
                        </div> 
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {uploadedImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {uploadedImagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-video rounded-md overflow-hidden">
                            <Image src={src} alt={`Vista previa subida ${index + 1}`} fill className="object-cover" />
                        </div>
                    ))}
                </div>
              )}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analizar Portafolio
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="h-full">
        <AnalysisReport result={analysisResult} isLoading={isPending} />
      </div>
    </div>
  );
}
