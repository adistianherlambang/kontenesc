"use client";

import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Smartphone,
  Sparkles
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface InstagramPreviewModalProps {
  item: ContentItem | null;
  onClose: () => void;
}

export default function InstagramPreviewModal({
  item,
  onClose
}: InstagramPreviewModalProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(148);

  if (!item) return null;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(item.caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(c => c - 1);
    } else {
      setLiked(true);
      setLikesCount(c => c + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden modal-content border border-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#1F6FB6] text-white flex items-center justify-center text-xs font-bold">
              #{item.no}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Pratinjau Feed Instagram
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Smartphone Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
          <div className="w-full max-w-[340px] bg-white rounded-[28px] border-[6px] border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Phone Top Notch Bar */}
            <div className="bg-slate-800 text-white text-[10px] px-5 py-1 flex items-center justify-between font-mono">
              <span>09:41</span>
              <div className="w-12 h-2.5 bg-slate-900 rounded-full" />
              <span>5G 100%</span>
            </div>

            {/* Instagram Profile Header */}
            <div className="p-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-[#1F6FB6] p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-[#1F6FB6]">
                    ESC
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    eldoradosemarangcell
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Metro Barat, Kota Metro
                  </p>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            {/* Feed Image Canvas Mockup */}
            <div className="ig-canvas-post relative select-none">
              {/* Category Watermark */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white">
                  {item.kategori}
                </span>
                <span className="text-[10px] font-mono text-white/80">
                  #{item.no} / 60
                </span>
              </div>

              {/* Main Copywriting in Feed */}
              <div className="my-auto py-2">
                <h3 className="text-sm font-extrabold text-amber-300 mb-2 drop-shadow-sm uppercase tracking-wide">
                  {item.judul}
                </h3>
                <p className="text-xs font-mono text-white/95 whitespace-pre-wrap leading-relaxed drop-shadow-xs">
                  {item.copywriting}
                </p>
              </div>

              {/* Store Branding Footer */}
              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-white/80">
                <span className="font-semibold">Eldorado Semarang Cell</span>
                <span className="text-[9px]">Swipe left ➔</span>
              </div>
            </div>

            {/* Post Interaction Bar */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button onClick={handleLike} className="cursor-pointer">
                    <Heart className={`w-5 h-5 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
                  </button>
                  <MessageCircle className="w-5 h-5 text-slate-700" />
                  <Send className="w-5 h-5 text-slate-700" />
                </div>
                <Bookmark className="w-5 h-5 text-slate-700" />
              </div>
              <p className="text-[11px] font-bold text-slate-800 mb-1">
                {likesCount} suka
              </p>

              {/* Caption Preview */}
              <div className="text-[11px] text-slate-800 leading-relaxed max-h-40 overflow-y-auto pr-1">
                <span className="font-bold mr-1">eldoradosemarangcell</span>
                <span className="whitespace-pre-line text-slate-700">
                  {item.caption}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Quick Copy Button */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 truncate">
            Format: <span className="font-semibold text-slate-700">{item.platform || "Instagram Feed"}</span>
          </p>
          <button
            onClick={handleCopyCaption}
            className="btn-primary text-xs py-2 px-4 shadow-sm"
          >
            {copiedCaption ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Caption Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Caption Lengkap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
