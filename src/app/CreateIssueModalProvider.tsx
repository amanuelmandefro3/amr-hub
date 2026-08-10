"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CreateIssueModal } from "./components/CreateIssueModal";

type CreateIssueModalContextValue = {
  open: (projectId?: string | null) => void;
  close: () => void;
};

const CreateIssueModalContext =
  createContext<CreateIssueModalContextValue | null>(null);

export function CreateIssueModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{
    isOpen: boolean;
    projectId: string | null;
  }>({ isOpen: false, projectId: null });

  const open = useCallback((projectId?: string | null) => {
    setState({ isOpen: true, projectId: projectId ?? null });
  }, []);

  const close = useCallback(() => {
    setState((current) => ({ ...current, isOpen: false }));
  }, []);

  return (
    <CreateIssueModalContext.Provider value={{ open, close }}>
      {children}
      {state.isOpen && (
        <CreateIssueModal projectId={state.projectId} onClose={close} />
      )}
    </CreateIssueModalContext.Provider>
  );
}

export function useCreateIssueModal() {
  const context = useContext(CreateIssueModalContext);

  if (!context) {
    throw new Error(
      "useCreateIssueModal must be used within a CreateIssueModalProvider",
    );
  }

  return context;
}
