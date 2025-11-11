import { useState, useEffect, useCallback } from "react";
import { database } from "../firebase";
import { ref, push, set, onValue, remove, update } from "firebase/database";
import type { SavedCanvas, CanvasItem, Connector, CardCategory } from "../types";

export function useFirebaseStorage() {
  const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 실시간 데이터 동기화
  useEffect(() => {
    console.log("🔥 Firebase 연결 시작...");
    console.log("📍 Database URL:", database.app.options.databaseURL);
    const canvasesRef = ref(database, "canvases");
    console.log("📂 참조 경로:", canvasesRef.toString());
    
    const unsubscribe = onValue(
      canvasesRef,
      (snapshot) => {
        console.log("📊 Firebase 데이터 수신:", snapshot.exists());
        const data = snapshot.val();
        if (data) {
          console.log("✅ 데이터 있음:", Object.keys(data).length, "개");
          const canvasArray: SavedCanvas[] = Object.entries(data).map(
            ([id, canvas]) => ({
              ...(canvas as Omit<SavedCanvas, "id">),
              id,
            })
          );
          // 최신순 정렬
          canvasArray.sort((a, b) => b.updatedAt - a.updatedAt);
          setSavedCanvases(canvasArray);
          console.log("📦 저장된 캔버스:", canvasArray.length, "개");
        } else {
          console.log("⚠️ 데이터 없음");
          setSavedCanvases([]);
        }
        setError(null);
      },
      (error: any) => {
        console.error("❌ Firebase 데이터 로드 에러:", error);
        console.error("🔴 에러 코드:", error.code);
        console.error("🔴 에러 메시지:", error.message);
        console.error("🔴 에러 전체:", error);
        
        if (error.code === 'PERMISSION_DENIED') {
          console.error("🚫 권한 거부! Firebase 보안 규칙을 확인하세요:");
          console.error("필요한 규칙:");
          console.error(JSON.stringify({
            rules: {
              canvases: {
                ".read": true,
                ".write": true
              }
            }
          }, null, 2));
        }
        
        setError(error.message);
      }
    );

    return () => {
      console.log("🔌 Firebase 연결 해제");
      unsubscribe();
    };
  }, []);

  // 캔버스 저장
  const saveCanvas = useCallback(
    async (
      title: string,
      category: CardCategory,
      items: CanvasItem[],
      connectors: Connector[],
      description?: string,
      thumbnail?: string
    ): Promise<string> => {
      console.log("💾 캔버스 저장 시작...");
      console.log("📝 제목:", title);
      console.log("🏷️ 카테고리:", category);
      console.log("📦 아이템 수:", items.length);
      console.log("🔗 연결선 수:", connectors.length);
      
      setIsLoading(true);
      setError(null);

      try {
        const canvasesRef = ref(database, "canvases");
        console.log("📂 저장 경로:", canvasesRef.toString());
        
        const newCanvasRef = push(canvasesRef);
        console.log("🆔 생성된 ID:", newCanvasRef.key);
        
        const newCanvas: Omit<SavedCanvas, "id"> = {
          title,
          category,
          items,
          connectors,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          description,
          thumbnail,
        };

        console.log("📤 Firebase에 데이터 전송 중...");
        await set(newCanvasRef, newCanvas);
        console.log("✅ Firebase 저장 완료!");
        setIsLoading(false);
        
        return newCanvasRef.key!;
      } catch (err: any) {
        console.error("❌ 캔버스 저장 에러:", err);
        console.error("에러 상세:", JSON.stringify(err, null, 2));
        setError(err.message);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  // 캔버스 업데이트
  const updateCanvas = useCallback(
    async (
      id: string,
      updates: Partial<Omit<SavedCanvas, "id" | "createdAt">>
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const canvasRef = ref(database, `canvases/${id}`);
        await update(canvasRef, {
          ...updates,
          updatedAt: Date.now(),
        });
        setIsLoading(false);
      } catch (err: any) {
        console.error("캔버스 업데이트 에러:", err);
        setError(err.message);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  // 캔버스 삭제
  const deleteCanvas = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const canvasRef = ref(database, `canvases/${id}`);
      await remove(canvasRef);
      setIsLoading(false);
    } catch (err: any) {
      console.error("캔버스 삭제 에러:", err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // 카테고리별 캔버스 필터링
  const getCanvasesByCategory = useCallback(
    (category: CardCategory): SavedCanvas[] => {
      return savedCanvases.filter((canvas) => canvas.category === category);
    },
    [savedCanvases]
  );

  // 캔버스 로드 (ID로)
  const loadCanvas = useCallback(
    (id: string): SavedCanvas | undefined => {
      return savedCanvases.find((canvas) => canvas.id === id);
    },
    [savedCanvases]
  );

  return {
    savedCanvases,
    isLoading,
    error,
    saveCanvas,
    updateCanvas,
    deleteCanvas,
    getCanvasesByCategory,
    loadCanvas,
  };
}
