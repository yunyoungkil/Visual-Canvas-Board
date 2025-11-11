import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFirebaseStorage } from "../hooks/useFirebaseStorage";
import type { SavedCanvas, CardCategory } from "../types";
import Icon from "./Icon";

const SavedCanvasesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { savedCanvases, deleteCanvas, saveCanvas, isLoading } = useFirebaseStorage();
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | "all">("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // URL 경로에 따라 초기 카테고리 설정
  useEffect(() => {
    const path = location.pathname;
    console.log("🌐 현재 경로:", path);
    if (path === "/scraps") {
      setSelectedCategory("scrap");
    } else if (path === "/kanban/ideas") {
      setSelectedCategory("idea");
    } else if (path === "/kanban/in-progress") {
      setSelectedCategory("planning");
    } else {
      setSelectedCategory("all");
    }
  }, [location.pathname]);

  // 데이터 로딩 디버깅
  useEffect(() => {
    console.log("📋 전체 캔버스 수:", savedCanvases.length);
    console.log("🎯 선택된 카테고리:", selectedCategory);
  }, [savedCanvases, selectedCategory]);

  const categoryLabels: Record<CardCategory | "all", string> = {
    all: "전체",
    scrap: "스크랩",
    idea: "아이디어",
    planning: "기획/작성 중",
  };

  const categoryColors: Record<CardCategory | "all", string> = {
    all: "bg-gray-500",
    scrap: "bg-blue-500",
    idea: "bg-yellow-500",
    planning: "bg-green-500",
  };

  // 필터링된 캔버스
  const filteredCanvases = selectedCategory === "all"
    ? savedCanvases
    : savedCanvases.filter((canvas) => canvas.category === selectedCategory);

  // 무한 스크롤 처리
  const displayedCanvases = filteredCanvases.slice(0, page * itemsPerPage);
  const hasMore = displayedCanvases.length < filteredCanvases.length;

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
      hasMore &&
      !isLoading
    ) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // 카테고리 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCanvasClick = (canvas: SavedCanvas) => {
    // 캔버스 데이터를 localStorage에 임시 저장
    localStorage.setItem("loadCanvas", JSON.stringify({
      items: canvas.items,
      connectors: canvas.connectors,
    }));
    // 메인 페이지로 이동
    navigate("/");
  };

  const handleDeleteCanvas = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("이 캔버스를 삭제하시겠습니까?")) {
      try {
        await deleteCanvas(id);
      } catch (error) {
        console.error("캔버스 삭제 실패:", error);
        alert("캔버스 삭제에 실패했습니다.");
      }
    }
  };

  // 테스트 데이터 저장
  const handleSaveTestData = async () => {
    try {
      console.log("🧪 테스트 데이터 저장 시작...");
      await saveCanvas(
        "테스트 캔버스",
        "idea",
        [],
        [],
        "Firebase 연결 테스트용 캔버스입니다.",
        undefined
      );
      alert("테스트 데이터가 저장되었습니다!");
    } catch (error) {
      console.error("테스트 데이터 저장 실패:", error);
      alert("저장 실패: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">저장된 캔버스</h1>
            <div className="flex gap-2">
              <button
                onClick={handleSaveTestData}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                title="Firebase 연결 테스트"
              >
                🧪 테스트 저장
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Icon name="undo" className="w-5 h-5" />
                메인으로 돌아가기
              </button>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2">
            {(["all", "scrap", "idea", "planning"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  // URL도 함께 변경
                  if (cat === "all") {
                    navigate("/saved");
                  } else if (cat === "scrap") {
                    navigate("/scraps");
                  } else if (cat === "idea") {
                    navigate("/kanban/ideas");
                  } else if (cat === "planning") {
                    navigate("/kanban/in-progress");
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${categoryColors[cat]}`}></div>
                {categoryLabels[cat]}
                {cat === "all" ? (
                  <span className="text-sm">({savedCanvases.length})</span>
                ) : (
                  <span className="text-sm">
                    ({savedCanvases.filter((c) => c.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 카드 그리드 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredCanvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <Icon name="fileX" className="w-24 h-24 mb-4" />
            <p className="text-lg">저장된 캔버스가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-6">
              {displayedCanvases.map((canvas) => (
                <div
                  key={canvas.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
                  onClick={() => handleCanvasClick(canvas)}
                >
                  {/* 썸네일 */}
                  <div className="w-full h-48 bg-gray-200 relative overflow-hidden">
                    {canvas.thumbnail ? (
                      <img
                        src={canvas.thumbnail}
                        alt={canvas.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Icon name="image" className="w-16 h-16" />
                      </div>
                    )}
                    
                    {/* 카테고리 뱃지 */}
                    <div className={`absolute top-2 left-2 px-2 py-1 ${categoryColors[canvas.category]} text-white text-xs rounded-full`}>
                      {categoryLabels[canvas.category]}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => handleDeleteCanvas(canvas.id, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 hover:bg-red-600 rounded-full text-white"
                      title="삭제"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 내용 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600">
                      {canvas.title}
                    </h3>

                    {canvas.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {canvas.description}
                      </p>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-2">
                        <span>{canvas.items.length} 항목</span>
                        <span>•</span>
                        <span>{canvas.connectors.length} 연결</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(canvas.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 로딩 인디케이터 */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <div className="text-gray-500">스크롤하여 더 보기...</div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SavedCanvasesPage;
