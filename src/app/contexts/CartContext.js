"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getCart } from "@/lib/api/cart";
import { useLogin } from "./LoginContext";

const CartContext = createContext({ cartCount: 0, cartItems: [], refreshCart: () => {}, showCartHint: false });

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useLogin();
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  /** Briefly true after a cart mutation — Header uses this to show the mini-cart tooltip */
  const [showCartHint, setShowCartHint] = useState(false);
  const hintTimer = useRef(null);

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      setCartItems([]);
      return;
    }
    try {
      const cart = await getCart();
      const items = cart?.items || [];
      setCartItems(items);
      // total quantity across all SKUs
      setCartCount(items.reduce((sum, it) => sum + (it.quantity || 1), 0));
    } catch {
      setCartCount(0);
      setCartItems([]);
    }
  }, [isLoggedIn]);

  /** Call after any cart mutation to briefly flash the mini-cart tooltip in the header */
  const triggerCartHint = useCallback(() => {
    setShowCartHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowCartHint(false), 3500);
  }, []);

  // Reload whenever login state changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  return (
    <CartContext.Provider value={{ cartCount, cartItems, refreshCart, showCartHint, triggerCartHint }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
