"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { lessons, type Lesson } from "@/lib/data";
import type { TeacherMaterial } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  Folder,
  File,
  Play,
  Square,
  Trash2,
  Package,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

declare global {
  interface Window {
    loadPyodide?: any;
    _pyodideInstance?: any;
    _pyInterruptBuffer?: Int32Array;
  }
}

export default function StudentLessonPortal() {
  const params = useParams();
  const { id } = params as { id: string };
  const { user, enrolledCourses, loading: authLoading } = useAuth();

  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] =
    useState<TeacherMaterial | null>(null);

  const isEnrolled = enrolledCourses.includes(id);

  useEffect(() => {
    const currentLesson = lessons.find((l) => l.id === id);
    if (currentLesson) {
      setLesson(currentLesson);
    } else {
      if (!authLoading) notFound();
    }
  }, [id, authLoading]);

  useEffect(() => {
    if (!isEnrolled || !lesson) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "materials"),
      where("lesson", "==", lesson.title)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const materialsData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as TeacherMaterial))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setMaterials(materialsData);

        const firstImage = materialsData.find((m) =>
          m.fileType.startsWith("image/")
        );
        setSelectedImage(firstImage || null);

        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching materials:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isEnrolled, lesson, authLoading]);

  const imageMaterials = materials.filter(
    (m) =>
      m.fileType.startsWith("image/") || m.fileType.startsWith("application/pdf")
  );
  const otherMaterials = materials.filter(
    (m) =>
      !m.fileType.startsWith("image/") &&
      !m.fileType.startsWith("application/pdf")
  );

  const groupMaterials = (materialList: TeacherMaterial[]) => {
    return materialList.reduce((acc, material) => {
      const key = material.folder || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(material);
      return acc;
    }, {} as Record<string, TeacherMaterial[]>);
  };

  const groupedImageMaterials = groupMaterials(imageMaterials);
  const groupedOtherMaterials = groupMaterials(otherMaterials);

  // ---------- PYTHON COMPILER (only for `computer-sciences`) ----------
  const enablePythonCompiler = id === "computer-sciences";

  const [pyReady, setPyReady] = useState(false);
  const [pyStatus, setPyStatus] = useState<
    "loading" | "ready" | "running" | "error"
  >("loading");
  const [running, setRunning] = useState(false);
  const interruptCapableRef = useRef(false);

  const [code, setCode] = useState<string>(
    `# input() ve for döngüsü örneği
n = int(input("Kaç sayı gireceksin? "))
toplam = 0
for i in range(n):
    x = int(input("Sayı: "))
    toplam += x
print("Toplam =", toplam)`
  );
  const [output, setOutput] = useState<string>("");
  const [pkgName, setPkgName] = useState<string>("");

  useEffect(() => {
    if (!enablePythonCompiler) return;
    let cancelled = false;

    async function load() {
      try {
        if (!window.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src =
              "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Pyodide script yüklenemedi"));
            document.head.appendChild(s);
          });
        }
        if (cancelled) return;

        const pyodide = await window.loadPyodide({
          stdin: () => "",
          stdout: (s: any) => setOutput((prev) => prev + String(s)),
          stderr: (s: any) => setOutput((prev) => prev + String(s)),
        });

        // input() override
        await pyodide.runPythonAsync(`
import builtins
from js import prompt
def _input(msg: str = ""):
    s = prompt(msg)
    if s is None:
        raise EOFError("Input canceled")
    return s
builtins.input = _input
        `);

        // interrupt buffer (opsiyonel)
        try {
          if (typeof SharedArrayBuffer !== "undefined") {
            const interruptBuffer = new Int32Array(
              new SharedArrayBuffer(4)
            );
            pyodide.setInterruptBuffer(interruptBuffer);
            window._pyInterruptBuffer = interruptBuffer;
            interruptCapableRef.current = true;
          }
        } catch {
          interruptCapableRef.current = false;
        }

        window._pyodideInstance = pyodide;
        if (!cancelled) {
          setPyReady(true);
          setPyStatus("ready");
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setPyStatus("error");
          setPyReady(false);
          setOutput(
            (prev) => prev + `\n[HATA] Pyodide yüklenemedi: ${e?.message || e}\n`
          );
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enablePythonCompiler]);

  const runCode = async () => {
    if (!pyReady || running) return;
    const pyodide = window._pyodideInstance;
    if (!pyodide) return;

    setRunning(true);
    setPyStatus("running");

    try {
      await pyodide.runPythonAsync(code);
    } catch (err: any) {
      setOutput((prev) => prev + `\n[HATA] ${err?.message || String(err)}\n`);
    } finally {
      setRunning(false);
      setPyStatus("ready");
      const buf = window._pyInterruptBuffer;
      if (buf) buf[0] = 0;
    }
  };

  const stopRun = () => {
    const buf = window._pyInterruptBuffer;
    if (interruptCapableRef.current && buf) {
      Atomics.store(buf, 0, 2);
      Atomics.notify(buf, 0);
      setOutput(
        (prev) => prev + `\n[İPTAL] Çalıştırma durdurma istendi (KeyboardInterrupt).\n`
      );
    } else {
      setOutput(
        (prev) =>
          prev +
          `\n[Uyarı] Bu ortamda durdurma desteklenmiyor. Kod kendi bitene kadar sürebilir.\n`
      );
    }
  };

  const clearOutput = () => setOutput("");

  const installPkg = async () => {
    if (!pyReady || !pkgName.trim()) return;
    const pyodide = window._pyodideInstance;
    try {
      setOutput((prev) => prev + `[micropip] ${pkgName} kuruluyor...\n`);
      await pyodide.runPythonAsync(
        `import micropip\nawait micropip.install('${pkgName.trim()}')`
      );
      setOutput((prev) => prev + `[micropip] ${pkgName} kuruldu.\n`);
      setPkgName("");
    } catch (e: any) {
      setOutput((prev) => prev + `[micropip] Hata: ${e?.message || e}\n`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode =
        code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd =
          start + 4;
      }, 0);
    }
  };
  // ---------------------------------------------------------------

  // ---------- GRAPHICAL DISPLAY CALCULATOR (only for `math-1`) ----------
  const enableGraphCalc = id === "math-1";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [expr, setExpr] = useState("sin(x) + x^2/10");
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Güvenli sayılabilecek mini evaluator (yalnızca Math ve x)
  const compileExpr = (raw: string) => {
    // ^ operatörünü ** ile değiştir
    const js = raw.replace(/\^/g, "**");
    // Yalnızca Math + x kullanılacak şekilde kapsama al
    // eslint-disable-next-line no-new-func
    const fn = new Function("x", `with (Math) { return (${js}); }`);
    return (x: number) => {
      const v = fn(x);
      if (typeof v !== "number" || !isFinite(v)) {
        throw new Error("Geçersiz değer");
      }
      return v;
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Temizle
    ctx.clearRect(0, 0, W, H);

    // Arkaplan
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--background") || "#0b0b0b";
    // Tailwind varlıklarına güvenmeyelim; açık/koyu temada nötr arka plan:
    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(0, 0, W, H);

    // Koordinat dönüşümü
    const toPxX = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const toPxY = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

    // Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    const gridStepX = niceStep((xMax - xMin) / 10);
    for (let gx = Math.ceil(xMin / gridStepX) * gridStepX; gx <= xMax; gx += gridStepX) {
      const px = toPxX(gx);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    const gridStepY = niceStep((yMax - yMin) / 10);
    for (let gy = Math.ceil(yMin / gridStepY) * gridStepY; gy <= yMax; gy += gridStepY) {
      const py = toPxY(gy);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }

    // Eksenler
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    // x-ekseni
    if (yMin < 0 && yMax > 0) {
      const py0 = toPxY(0);
      ctx.beginPath();
      ctx.moveTo(0, py0);
      ctx.lineTo(W, py0);
      ctx.stroke();
    }
    // y-ekseni
    if (xMin < 0 && xMax > 0) {
      const px0 = toPxX(0);
      ctx.beginPath();
      ctx.moveTo(px0, 0);
      ctx.lineTo(px0, H);
      ctx.stroke();
    }

    // Fonksiyonu çiz
    let f: (x: number) => number;
    try {
      f = compileExpr(expr);
      setEvalError(null);
    } catch (e: any) {
      setEvalError("İfade derlenemedi: " + (e?.message || e));
      return;
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#7dd3fc"; // açık mavi
    ctx.beginPath();
    const samples = W; // her piksel için numune
    let started = false;
    for (let i = 0; i <= samples; i++) {
      const x = xMin + ((xMax - xMin) * i) / samples;
      let y: number;
      try {
        y = f(x);
      } catch {
        // süreksizlik veya hata: segmenti kes
        started = false;
        continue;
      }
      const px = toPxX(x);
      const py = toPxY(y);
      if (!isFinite(py)) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Basit eksen etiketleri
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(`x:[${xMin}, ${xMax}]  y:[${yMin}, ${yMax}]`, 10, 16);
  };

  // Daha okunabilir grid adımı
  function niceStep(delta: number) {
    const pow10 = Math.pow(10, Math.floor(Math.log10(delta)));
    const d = delta / pow10;
    let step = pow10;
    if (d < 1.5) step = 1 * pow10;
    else if (d < 3) step = 2 * pow10;
    else if (d < 7) step = 5 * pow10;
    else step = 10 * pow10;
    return step;
  }

  useEffect(() => {
    if (!enableGraphCalc) return;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableGraphCalc, expr, xMin, xMax, yMin, yMax]);

  // Canvas pan & zoom
  useEffect(() => {
    if (!enableGraphCalc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: MouseEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const W = canvas.width;
      const H = canvas.height;
      const scaleX = (xMax - xMin) / W;
      const scaleY = (yMax - yMin) / H;

      setXMin((v) => v - dx * scaleX);
      setXMax((v) => v - dx * scaleX);
      setYMin((v) => v + dy * scaleY);
      setYMax((v) => v + dy * scaleY);
    };
    const onUp = () => (dragging = false);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const xAtCursor = xMin + (cx / canvas.width) * (xMax - xMin);
      const yAtCursor = yMin + ((canvas.height - cy) / canvas.height) * (yMax - yMin);

      const newXRange = (xMax - xMin) * zoomFactor;
      const newYRange = (yMax - yMin) * zoomFactor;

      setXMin(xAtCursor - (xAtCursor - xMin) * zoomFactor);
      setXMax(xAtCursor + (xMax - xAtCursor) * zoomFactor);
      setYMin(yAtCursor - (yAtCursor - yMin) * zoomFactor);
      setYMax(yAtCursor + (yMax - yAtCursor) * zoomFactor);

      // sınır makul kalsın
      if (newXRange < 1e-6 || newYRange < 1e-6) return;
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableGraphCalc, xMin, xMax, yMin, yMax]);

  const resetView = () => {
    setXMin(-10); setXMax(10); setYMin(-10); setYMax(10);
  };

  const zoomIn = () => {
    setXMin((v) => v * 0.8);
    setXMax((v) => v * 0.8);
    setYMin((v) => v * 0.8);
    setYMax((v) => v * 0.8);
  };

  const zoomOut = () => {
    setXMin((v) => v * 1.25);
    setXMax((v) => v * 1.25);
    setYMin((v) => v * 1.25);
    setYMax((v) => v * 1.25);
  };

  const panLeft = () => {
    const dx = (xMax - xMin) * 0.1;
    setXMin((v) => v - dx);
    setXMax((v) => v - dx);
  };
  const panRight = () => {
    const dx = (xMax - xMin) * 0.1;
    setXMin((v) => v + dx);
    setXMax((v) => v + dx);
  };
  // ----------------------------------------------------------------------

  if (authLoading || (isLoading && isEnrolled)) {
    return (
      <div className="container py-12">
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
              <div className="md:col-span-3">
                <Skeleton className="h-[40rem] w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><AlertTriangle className="text-destructive h-6 w-6" /> Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You are not enrolled in this course. Access to materials is restricted.</p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/student">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    if (!authLoading) notFound();
    return null;
  }

  return (
    <div className="container py-12">
      <div className="mb-10 mx-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          {lesson.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          Bu dersin özel paneline hoşgeldin
        </p>
      </div>

      {/* === Kaynak Görüntüleme Ekranı === */}
      <Card>
        <CardHeader>
          <CardTitle>Kaynaklar</CardTitle>
          <CardDescription>Görüntülemek için bir kaynak seç</CardDescription>
        </CardHeader>
        <CardContent>
          {imageMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <ScrollArea className="h-[40rem] pr-4">
                  <Accordion
                    type="multiple"
                    defaultValue={Object.keys(groupedImageMaterials)}
                    className="w-full"
                  >
                    {Object.entries(groupedImageMaterials).map(
                      ([folderName, folderMaterials]) => (
                        <AccordionItem value={folderName} key={folderName}>
                          <AccordionTrigger className="text-base font-medium hover:no-underline">
                            <div className="flex items-center gap-2">
                              {folderName !== "Uncategorized" && (
                                <Folder className="h-5 w-5 text-primary" />
                              )}
                              {folderName}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-2">
                              {folderMaterials.map((material) => (
                                <button
                                  key={material.id}
                                  onClick={() => setSelectedImage(material)}
                                  className={cn(
                                    "w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3",
                                    selectedImage?.id === material.id
                                      ? "bg-muted border-primary"
                                      : "hover:bg-muted/50"
                                  )}
                                >
                                  <File className="h-5 w-5 text-primary/80" />
                                  <span className="flex-1 truncate">
                                    {material.displayName}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    )}
                  </Accordion>
                </ScrollArea>
              </div>
              <div className="md:col-span-3">
                {selectedImage ? (
                  <div className="relative h-[40rem] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                    {selectedImage.downloadURL && (
                      <Image
                        src={selectedImage.downloadURL}
                        alt={selectedImage.displayName}
                        fill
                        style={{ objectFit: "contain" }}
                        className="p-4"
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-[40rem] w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    <p>Resim Seçilmedi</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
              <p>Henüz bu kursa bir materyal eklenmedi.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Python Compiler (only for computer-sciences) === */}
      {enablePythonCompiler && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Python Çalışma Alanı</CardTitle>
            <CardDescription>
              Tarayıcıda Pyodide ile Python kodu çalıştır
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <label className="text-sm text-muted-foreground">Kod</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mt-2 w-full h-[22rem] rounded-lg border bg-background p-3 font-mono text-sm"
                  spellCheck={false}
                />
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Button onClick={runCode} disabled={!pyReady || running} size="sm">
                    <Play className="w-4 h-4 mr-2" /> Çalıştır
                  </Button>
                  <Button
                    onClick={stopRun}
                    variant="secondary"
                    disabled={!running && !interruptCapableRef.current}
                    size="sm"
                  >
                    <Square className="w-4 h-4 mr-2" /> Durdur
                  </Button>
                  <Button onClick={clearOutput} variant="secondary" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" /> Temizle
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {!pyReady
                      ? "Pyodide yükleniyor…"
                      : running
                      ? "Çalışıyor…"
                      : pyStatus === "error"
                      ? "Hata"
                      : "Hazır"}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <label className="text-sm text-muted-foreground">Terminal</label>
                <pre className="mt-2 w-full h-[22rem] rounded-lg border bg-muted/30 p-3 overflow-auto text-sm font-mono whitespace-pre-wrap">
                  {output}
                </pre>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <input
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder="ör. numpy"
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                    />
                  </div>
                  <Button
                    onClick={installPkg}
                    variant="secondary"
                    disabled={!pyReady || !pkgName.trim()}
                    size="sm"
                  >
                    Kur
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Graphical Display Calculator (only for math-1) === */}
      {enableGraphCalc && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Graphical Display Calculator</CardTitle>
            <CardDescription>f(x) ifadesini çiz, alan ve görünümü ayarla</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-sm text-muted-foreground">f(x) =</span>
                  <input
                    value={expr}
                    onChange={(e) => setExpr(e.target.value)}
                    className="flex-1 min-w-[260px] h-9 rounded-md border bg-background px-3 text-sm font-mono"
                    placeholder="ör. sin(x) + x^2/10"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">x min</span>
                    <input
                      type="number"
                      value={xMin}
                      onChange={(e) => setXMin(Number(e.target.value))}
                      className="w-24 h-8 rounded-md border bg-background px-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">x max</span>
                    <input
                      type="number"
                      value={xMax}
                      onChange={(e) => setXMax(Number(e.target.value))}
                      className="w-24 h-8 rounded-md border bg-background px-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">y min</span>
                    <input
                      type="number"
                      value={yMin}
                      onChange={(e) => setYMin(Number(e.target.value))}
                      className="w-24 h-8 rounded-md border bg-background px-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">y max</span>
                    <input
                      type="number"
                      value={yMax}
                      onChange={(e) => setYMax(Number(e.target.value))}
                      className="w-24 h-8 rounded-md border bg-background px-2 text-sm"
                    />
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={zoomIn} title="Yakınlaştır">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={zoomOut} title="Uzaklaştır">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={panLeft} title="Sola kaydır">
                      <MoveHorizontal className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={panRight} title="Sağa kaydır">
                      <MoveHorizontal className="w-4 h-4 rotate-180" />
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={resetView} title="Sıfırla">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-2">
                  <canvas
                    ref={canvasRef}
                    width={900}
                    height={420}
                    className="w-full h-[420px] rounded-md"
                  />
                </div>
                {evalError && (
                  <p className="text-sm text-destructive mt-2">{evalError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  İpuçları: `^` operatörü desteklenir (örn. <code>x^2</code>). Kullanılabilir fonksiyon örnekleri: <code>sin</code>, <code>cos</code>, <code>tan</code>, <code>exp</code>, <code>log</code>, <code>sqrt</code>, <code>abs</code>, <code>min</code>, <code>max</code>, sabitler: <code>PI</code>, <code>E</code>.
                  Grafik üzerinde fareyle **sürükle** (pan) ve **tekerlek** (zoom) kullanabilirsin.
                </p>
              </div>

              <div className="lg:col-span-1">
                <div className="rounded-lg border p-3">
                  <h4 className="font-medium mb-2">Örnekler</h4>
                  <div className="space-y-2">
                    {[
                      "sin(x)",
                      "cos(3*x)",
                      "x^2 - 4*x + 3",
                      "exp(-x/3)*sin(4*x)",
                      "log(abs(x)+1)",
                      "sqrt(abs(x))",
                    ].map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setExpr(ex)}
                        className="w-full text-left px-3 py-2 rounded-md border hover:bg-muted/50 font-mono text-sm"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {id === "circuit-design" && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              Bilgi Düzeyini Test Et
            </CardTitle>
            <CardDescription>Midterm-1 deneme testini yap ve seviyeni ölç</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              15 adet Midterm-1'de karşına çıkacak soru tipi göreceksin. Bol Şans!
            </p>
            <Button asChild>
              <Link href={`/dashboard/student/quiz/${id}`}>Quiz'e başla</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
