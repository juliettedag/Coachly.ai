"use client";

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/providers/language-provider';
import { FoodItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { analyzeImage } from '@/lib/openai';
import { analyzeFood } from '@/lib/edamam';

interface FoodRecognitionProps {
  onFoodIdentified: (foods: FoodItem[]) => void;
}

export function FoodRecognition({ onFoodIdentified }: FoodRecognitionProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [identifiedFoods, setIdentifiedFoods] = useState<FoodItem[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const captureImage = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCapturedImage(imageSrc);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Convert base64 image (remove data:image/jpeg;base64, prefix)
      const base64Image = imageSrc.split(',')[1];
      
      // Get AI analysis of the image
      const aiAnalysis = await analyzeImage(base64Image, language);
      
      // Use Edamam to get nutritional information
      const nutritionInfo = await analyzeFood(aiAnalysis);
      
      if (nutritionInfo) {
        const food: FoodItem = {
          name: aiAnalysis,
          portion: 1,
          unit: 'serving',
          nutrition: nutritionInfo
        };
        
        setIdentifiedFoods([food]);
      }

      setProgress(100);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: t('error'),
        description: t('imageProcessError'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmFoods = () => {
    onFoodIdentified(identifiedFoods);
    resetCapture();
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setIdentifiedFoods([]);
    setProgress(0);
    setIsProcessing(false);
  };

  return (
    <Dialog open={isCapturing} onOpenChange={setIsCapturing}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('captureFood')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!capturedImage ? (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
              <Button
                onClick={captureImage}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="w-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetCapture}
                  className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    {t('analyzing')}
                  </p>
                  <Progress value={progress} />
                </div>
              )}

              {identifiedFoods.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">{t('identifiedFoods')}</h3>
                    <ul className="space-y-2">
                      {identifiedFoods.map((food, index) => (
                        <li key={index} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                          <span>{food.name}</span>
                          <span>{food.nutrition.calories} kcal</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetCapture}
                      className="flex-1"
                    >
                      {t('retake')}
                    </Button>
                    <Button
                      onClick={confirmFoods}
                      className="flex-1"
                    >
                      {t('confirm')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}