import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Modal, type ModalProps, View } from "react-native";

type OverlayStackApi = {
  stack: string[];
  activeKey: string | null;
  open: (key: string) => void;
  close: (key: string) => void;
  closeTop: () => void;
};

const OverlayStackContext = createContext<OverlayStackApi | null>(null);

export function OverlayStackProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<string[]>([]);

  const open = useCallback((key: string) => {
    setStack((prev) => {
      if (prev.length === 0) return [key];
      if (prev[prev.length - 1] === key) return prev;
      const without = prev.filter((k) => k !== key);
      return [...without, key];
    });
  }, []);

  const close = useCallback((key: string) => {
    setStack((prev) => prev.filter((k) => k !== key));
  }, []);

  const closeTop = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const api = useMemo<OverlayStackApi>(() => {
    const activeKey = stack.length ? stack[stack.length - 1] : null;
    return { stack, activeKey, open, close, closeTop };
  }, [stack, open, close, closeTop]);

  return <OverlayStackContext.Provider value={api}>{children}</OverlayStackContext.Provider>;
}

export function useOverlayStack() {
  const ctx = useContext(OverlayStackContext);
  if (!ctx) throw new Error("useOverlayStack must be used within OverlayStackProvider");
  return ctx;
}

type StackModalProps = Omit<ModalProps, "visible" | "onRequestClose"> & {
  overlayKey: string;
  visible: boolean;
  onRequestClose?: () => void;
};

export function StackModal({ overlayKey, visible, onRequestClose, children, ...rest }: StackModalProps) {
  const { activeKey, open, close } = useOverlayStack();

  const lastVisibleRef = useRef<boolean>(false);

  useEffect(() => {
    if (visible && !lastVisibleRef.current) {
      open(overlayKey);
    }

    if (!visible && lastVisibleRef.current) {
      close(overlayKey);
    }

    lastVisibleRef.current = visible;
  }, [visible, overlayKey, open, close]);

  const isTop = visible && activeKey === overlayKey;

  return (
    <Modal
      visible={visible}
      onRequestClose={() => {
        if (!isTop) return;
        onRequestClose?.();
        close(overlayKey);
      }}
      {...rest}
    >
      <View style={{ flex: 1, opacity: isTop ? 1 : 0 }} pointerEvents={isTop ? "auto" : "none"}>
        {children}
      </View>
    </Modal>
  );
}
