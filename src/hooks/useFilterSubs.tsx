import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import ToastCustom from "../components/toast/ToastCustom";
import { subredditFilters } from "../MainContext";
import { useFilterContext } from "../contexts/FilterContext";
import { userFilters } from "../MainContext";
import { UseFilterSubsReturn } from "../../types";

const useFilterSubs = (): UseFilterSubsReturn => {
  const filterContext = useFilterContext(); 
  const {updateFilters, setUpdateFilters} = filterContext; 
  const [filteredSubs, setFilteredSubs] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);

  useEffect(() => {
    const loadFilters = async () => {
      const subs: string[] = [];
      const users: string[] = [];
      
      await subredditFilters.iterate((_, key) => {
        subs.push(key.toLowerCase());
      });
      
      await userFilters.iterate((_, key) => {
        users.push(key.toLowerCase());
      });
      
      setFilteredSubs(subs);
      setFilteredUsers(users);
    };

    loadFilters();
    return () => {
      setFilteredSubs([]);
      setFilteredUsers([]);
    };
  }, [updateFilters]);

  const addSubFilter = useCallback(async (sub: string, showToast = true) => {
    if (sub.includes("/")) {
      sub = sub.split("/")?.[1] ?? sub;
    }
    let exists = await subredditFilters.getItem(sub.toUpperCase());
    if (exists == undefined && sub.length > 0) {
      subredditFilters.setItem(sub.toUpperCase(), 1);
      setFilteredSubs((f) => [...f, sub.toLowerCase()]);
      showToast &&
        toast.custom(
          (t) => (
            <ToastCustom
              t={t}
              message={`Added r/${sub} to filters`}
              mode={"success"}
            />
          ),
          { position: "bottom-center", duration: 3000 }
        );
        setUpdateFilters(n => n+1);
    } else if (sub.length > 0) {
      showToast &&
        toast.custom(
          (t) => (
            <ToastCustom
              t={t}
              message={`r/${sub} already filtered`}
              mode={"error"}
            />
          ),
          { position: "bottom-center", duration: 3000 }
        );
    }
  }, [setUpdateFilters]);
  const removeSubFilter = useCallback(async (sub: string) => {
    let exists = await subredditFilters.getItem(sub.toUpperCase());
    if (exists) {
      subredditFilters.removeItem(sub.toUpperCase());
      setFilteredSubs((f) =>
        f.filter((s) => s.toLowerCase() !== sub.toLowerCase())
      );
      setUpdateFilters(n => n+1);
    }
  }, [setUpdateFilters]);
  const addUserFilter = useCallback(async (user: string, showToast = true) => {
    if (user.includes("/")) {
      user = user.split("/")?.[1] ?? user;
    }

    let exists = await userFilters.getItem(user.toUpperCase());
    if (exists == undefined && user.length > 0) {
      userFilters.setItem(user.toUpperCase(), 1);
      setFilteredUsers((f) => [...f, user.toLowerCase()]);
      showToast &&
        toast.custom(
          (t) => (
            <ToastCustom
              t={t}
              message={`Added u/${user} to filters`}
              mode={"success"}
            />
          ),
          { position: "bottom-center", duration: 3000 }
        );
        setUpdateFilters(n => n+1);

    } else if (user.length > 0) {
      showToast &&
        toast.custom(
          (t) => (
            <ToastCustom
              t={t}
              message={`u/${user} already filtered`}
              mode={"error"}
            />
          ),
          { position: "bottom-center", duration: 3000 }
        );
    }
  }, [setUpdateFilters]);
  const removeUserFilter = useCallback(async (user: string) => {
    let exists = await userFilters.getItem(user.toUpperCase());
    if (exists) {
      userFilters.removeItem(user.toUpperCase());
      setFilteredUsers((f) =>
        f.filter((u) => u.toLowerCase() !== user.toLowerCase())
      );
      setUpdateFilters(n => n+1);

    }
  }, [setUpdateFilters]);

  const clearAllFilters = useCallback(async () => {
    await subredditFilters.clear();
    await userFilters.clear();
    setFilteredSubs([]);
    setFilteredUsers([]);
    setUpdateFilters(n => n+1);
  }, [setUpdateFilters]);

  return {
    filteredSubs,
    filteredUsers,
    addSubFilter,
    removeSubFilter,
    addUserFilter,
    removeUserFilter,
    clearAllFilters,
  };
};

export default useFilterSubs;
