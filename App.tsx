import React, { useState, useCallback } from 'react';
import { ImageFile } from './types';
import { generateOrEditImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import SpinnerIcon from './components/SpinnerIcon';

const fileToImageFile = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const [header, data] = result.split(',');
            if (!header || !data) {
                return reject(new Error("تنسيق ملف غير صالح."));
            }
            const mimeType = header.match(/:(.*?);/)?.[1];
            if (!mimeType) {
                return reject(new Error("لا يمكن تحديد نوع الملف."));
            }
            resolve({ data, mimeType });
        };
        reader.onerror = (error) => reject(error);
    });
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 ml-2" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [image1, setImage1] = useState<ImageFile | null>(null);
    const [image2, setImage2] = useState<ImageFile | null>(null);
    const [preview1, setPreview1] = useState<string | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (file: File, slot: 1 | 2) => {
        try {
            setError(null);
            const imageFile = await fileToImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            if (slot === 1) {
                setImage1(imageFile);
                setPreview1(previewUrl);
            } else {
                setImage2(imageFile);
                setPreview2(previewUrl);
            }
        } catch (e: any) {
            setError(e.message || 'فشل في معالجة الملف.');
        }
    };

    const handleClear = (slot: 1 | 2) => {
        if (slot === 1) {
            if(preview1) URL.revokeObjectURL(preview1);
            setImage1(null);
            setPreview1(null);
        } else {
            if(preview2) URL.revokeObjectURL(preview2);
            setImage2(null);
            setPreview2(null);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt && !image1 && !image2) {
            setError("يرجى تقديم وصف أو صورة واحدة على الأقل.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const parts: any[] = [];
            if (image1) parts.push({ inlineData: { data: image1.data, mimeType: image1.mimeType } });
            if (image2) parts.push({ inlineData: { data: image2.data, mimeType: image2.mimeType } });
            if (prompt) parts.push({ text: prompt });

            const imageData = await generateOrEditImage(parts);
            setGeneratedImage(`data:image/png;base64,${imageData}`);
        } catch (e: any) {
            setError(e.message || "حدث خطأ غير متوقع.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt, image1, image2]);
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `peso-generated-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-900 min-h-screen text-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            PESO
                        </span>
                    </h1>
                    <p className="mt-2 text-xl text-gray-400">ستوديو توليد الصور بالذكاء الاصطناعي</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls Panel */}
                    <aside className="lg:col-span-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <ImageUploader id="uploader1" label="الصورة ١ (اختياري)" previewUrl={preview1} onFileSelect={(file) => handleFileSelect(file, 1)} onClear={() => handleClear(1)} isLoading={isLoading} />
                            <ImageUploader id="uploader2" label="الصورة ٢ (اختياري)" previewUrl={preview2} onFileSelect={(file) => handleFileSelect(file, 2)} onClear={() => handleClear(2)} isLoading={isLoading} />
                        </div>
                        
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-2">اكتب طلبك</label>
                            <textarea
                                id="prompt"
                                rows={6}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                                placeholder="مثال: قط يرتدي بدلة فضاء، صورة واقعية"
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-lg"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || (!prompt && !image1 && !image2)}
                            className="w-full text-xl flex items-center justify-center bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-purple-800/50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isLoading ? <SpinnerIcon className="w-6 h-6"/> : 'إنشاء الصورة'}
                        </button>

                        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm p-3 rounded-lg text-center">{error}</div>}
                    </aside>

                    {/* Output Panel */}
                    <section className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col items-center justify-center min-h-[400px] lg:min-h-0">
                        <div className="w-full aspect-square max-w-2xl relative bg-gray-900 rounded-lg flex items-center justify-center">
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 rounded-lg">
                                    <SpinnerIcon className="w-16 h-16"/>
                                    <p className="mt-4 text-xl">جاري إنشاء تحفتك الفنية...</p>
                                </div>
                            )}
                            {generatedImage ? (
                                <img src={generatedImage} alt="Generated result" className="object-contain w-full h-full rounded-lg" />
                            ) : (
                                !isLoading && <p className="text-gray-500 text-xl">صورتك ستظهر هنا</p>
                            )}
                        </div>
                        {generatedImage && !isLoading && (
                            <button
                                onClick={handleDownload}
                                className="mt-6 inline-flex items-center justify-center bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 text-lg"
                            >
                                تحميل
                                <DownloadIcon />
                            </button>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default App;