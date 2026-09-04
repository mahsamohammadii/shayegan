"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllContent } from "../../lib/api/content";

const ContentContext = createContext({ items: [], getByKey: () => null, getByType: () => [] });

export function ContentProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    getAllContent()
      .then(setItems)
      .catch(console.error);
  }, []);

  const getByKey  = (key)  => items.find(i => i.key  === key)  ?? null;
  const getByType = (type) => items.filter(i => i.type === type);

  return (
    <ContentContext.Provider value={{ items, getByKey, getByType }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
