import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Clock, Trash2, ArrowRight } from "lucide-react";
import { useRecordStore } from "../store/useRecordStore";

interface RecordsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "history" | "favorites";
  onSelectRecord: (record: any) => void;
}

export function RecordsDrawer({
  isOpen,
  onClose,
  initialTab = "history",
  onSelectRecord,
}: RecordsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"history" | "favorites">(
    initialTab,
  );
  const { records, removeRecord, toggleFavorite, clearHistory } =
    useRecordStore();

  const displayedRecords =
    activeTab === "favorites" ? records.filter((r) => r.isFavorite) : records;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("history")}
                  className={`text-lg font-bold transition-colors ${activeTab === "history" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  历史记录
                </button>
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`text-lg font-bold transition-colors ${activeTab === "favorites" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  收藏夹
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {displayedRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                  {activeTab === "history" ? (
                    <Clock className="w-12 h-12 opacity-20" />
                  ) : (
                    <Star className="w-12 h-12 opacity-20" />
                  )}
                  <p>暂无{activeTab === "history" ? "历史记录" : "收藏记录"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {displayedRecords.map((record) => (
                      <motion.div
                        key={record.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                        onClick={() => {
                          onSelectRecord(record);
                          onClose();
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 pr-12 line-clamp-2">
                            {record.title}
                          </h3>
                          <div className="flex gap-1 absolute top-4 right-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(record.id);
                              }}
                              className={`p-1.5 rounded-full transition-colors ${record.isFavorite ? "text-amber-400 hover:text-amber-500" : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"}`}
                            >
                              <Star
                                className="w-4 h-4"
                                strokeWidth={2.5}
                                fill={
                                  record.isFavorite ? "currentColor" : "none"
                                }
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecord(record.id);
                              }}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[13px] text-gray-500">
                          <span>{new Date(record.date).toLocaleString()}</span>
                          <span className="flex items-center gap-1 text-aviation group-hover:translate-x-1 transition-transform">
                            查看 <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {activeTab === "history" && records.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={clearHistory}
                  className="w-full py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  清空历史记录 (保留已收藏)
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
