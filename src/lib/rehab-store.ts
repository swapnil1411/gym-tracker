"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";

export interface RehabList {
  id: string;
  name: string;
  /** Exercise ids, in the order you added them. */
  exerciseIds: string[];
}

/**
 * settings/rehab — your own named rehab lists.
 *
 * Lists hold **exercise ids, never protocol ids**: building a list from a
 * protocol snapshots its members at that moment, so editing PROTOCOLS later
 * can't silently rewrite a routine someone does every morning.
 */
export function useRehabLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<RehabList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }
    const ref = doc(getDb(), "users", user.uid, "settings", "rehab");
    return onSnapshot(ref, (snap) => {
      const data = snap.data() as
        | { lists?: RehabList[]; pinned?: string[] }
        | undefined;

      if (data?.lists) {
        setLists(data.lists);
      } else if (data?.pinned?.length) {
        // Carry over the flat pin list this screen used before lists existed,
        // rather than dropping whatever someone had already pinned.
        setLists([{ id: "pinned", name: "My pins", exerciseIds: data.pinned }]);
      } else {
        setLists([]);
      }
      setLoading(false);
    });
  }, [user]);

  const write = useCallback(
    async (next: RehabList[]) => {
      if (!user) return;
      setLists(next); // optimistic; the snapshot echoes it back anyway
      await setDoc(
        doc(getDb(), "users", user.uid, "settings", "rehab"),
        { lists: next },
        { merge: true }
      );
    },
    [user]
  );

  const createList = useCallback(
    (name: string, seedIds: string[] = []) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `l${Date.now()}`;
      write([...lists, { id, name: name.trim() || "Untitled list", exerciseIds: seedIds }]);
      return id;
    },
    [lists, write]
  );

  const deleteList = useCallback(
    (id: string) => write(lists.filter((l) => l.id !== id)),
    [lists, write]
  );

  const renameList = useCallback(
    (id: string, name: string) =>
      write(lists.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l))),
    [lists, write]
  );

  /** Add or remove one exercise from one list. */
  const toggleIn = useCallback(
    (listId: string, exerciseId: string) =>
      write(
        lists.map((l) =>
          l.id !== listId
            ? l
            : {
                ...l,
                exerciseIds: l.exerciseIds.includes(exerciseId)
                  ? l.exerciseIds.filter((x) => x !== exerciseId)
                  : [...l.exerciseIds, exerciseId],
              }
        )
      ),
    [lists, write]
  );

  /** Add many at once, skipping ones already there so order is preserved. */
  const addMany = useCallback(
    (listId: string, ids: string[]) =>
      write(
        lists.map((l) =>
          l.id !== listId
            ? l
            : {
                ...l,
                exerciseIds: [
                  ...l.exerciseIds,
                  ...ids.filter((id) => !l.exerciseIds.includes(id)),
                ],
              }
        )
      ),
    [lists, write]
  );

  return { lists, loading, createList, deleteList, renameList, toggleIn, addMany };
}
