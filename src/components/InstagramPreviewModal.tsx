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
  MoreHorizontal
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface InstagramPreviewModalProps {
  item: ContentItem | null;
  onClose: () => void;
  onToggleExecuted?: (item: ContentItem) => void;
}

export default function InstagramPreviewModal({
  item,
  onClose,
  onToggleExecuted
}: InstagramPreviewModalProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCopywriting, setCopiedCopywriting] = useState(false);
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

  const handleCopyCopywriting = async () => {
    try {
      await navigator.clipboard.writeText(item.copywriting);
      setCopiedCopywriting(true);
      setTimeout(() => setCopiedCopywriting(false), 2000);
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            Pratinjau Feed Instagram
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Smartphone Screen Mockup */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#F7F6F3] flex justify-center">
          <div className="w-full max-w-[310px] bg-white rounded-[24px] border-[5px] border-[#1E293B] shadow-xl overflow-hidden flex flex-col">
            {/* Phone Top Notch Bar */}
            <div className="bg-[#1E293B] text-white text-[9px] px-4 py-1 flex items-center justify-between font-mono">
              <span>09:41</span>
              <div className="w-10 h-2 bg-slate-900 rounded-full" />
              <span>5G 100%</span>
            </div>

            {/* Instagram Profile Header */}
            <div className="p-2.5 flex items-center justify-between border-b border-[#E9E9E7]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-[#1F6FB6] p-[1.5px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[9px] text-[#1F6FB6]">
                    ESC
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 leading-tight">
                    eldoradosemarangcell
                  </h4>
                  <p className="text-[9px] text-slate-500">
                    Metro Barat, Kota Metro
                  </p>
                </div>
              </div>
              <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Feed Image Canvas Mockup */}
            <div className="ig-canvas-post relative select-none">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white">
                  {item.kategori}
                </span>
              </div>

              <div className="my-auto py-2">
                <h3 className="text-xs font-extrabold text-amber-300 mb-1.5 uppercase tracking-wide">
                  {item.judul}
                </h3>
                <p className="text-[11px] font-mono text-white/95 whitespace-pre-wrap leading-relaxed drop-shadow-xs">
                  {item.copywriting}
                </p>
              </div>

              <div className="pt-1.5 border-t border-white/20 flex items-center justify-between text-[9px] text-white/80">
                <span>Eldorado Semarang Cell</span>
                <span>Swipe ➔</span>
              </div>
            </div>

            {/* Post Interaction Bar */}
            <div className="p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <button onClick={handleLike} className="cursor-pointer">
                    <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
                  </button>
                  <MessageCircle className="w-4 h-4 text-slate-700" />
                  <Send className="w-4 h-4 text-slate-700" />
                </div>
                <Bookmark className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-[10px] font-bold text-slate-800 mb-1">
                {likesCount} suka
              </p>

              {/* Caption */}
              <div className="text-[10.5px] text-slate-800 leading-relaxed max-h-36 overflow-y-auto pr-1">
                <span className="font-bold mr-1">eldoradosemarangcell</span>
                <span className="whitespace-pre-line text-slate-700">
                  {item.caption}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer justify-between">
          {onToggleExecuted ? (
            <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(item.executed)}
                onChange={() => onToggleExecuted(item)}
                className="checkbox"
              />
              <span>Sudah Dieksekusi</span>
            </label>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCopywriting}
              className="btn btn-secondary text-xs"
            >
              {copiedCopywriting ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>Salin Teks</span>
            </button>
            <button
              type="button"
              onClick={handleCopyCaption}
              className="btn btn-primary text-xs"
            >
              {copiedCaption ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>Salin Caption</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
