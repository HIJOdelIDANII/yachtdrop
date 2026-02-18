"use client";

import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { useCallback, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const dragControls = useDragControls();

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-card shadow-xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragControls={dragControls}
            dragListener={false}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle — only this area triggers drag-to-dismiss */}
            <div
              className="sticky top-0 z-10 flex cursor-grab justify-center rounded-t-2xl bg-card pt-3 pb-2 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: "none" }}
            >
              <motion.div
                className="h-1 w-10 rounded-full bg-muted-foreground/30"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: 1, ease: "easeInOut" }}
              />
            </div>
            {title && (
              <h2 className="px-4 pb-2 text-lg font-semibold text-foreground">
                {title}
              </h2>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-24">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
