"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "@/components/Toast";

const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartTotal: 0,
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rx_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("rx_cart", JSON.stringify(cart));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (medicine, qty = 1) => {
    const id = Number(medicine.id);
    const existingItem = cart.find((item) => Number(item.medicineId) === id);

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      setCart((prev) =>
        prev.map((item) =>
          Number(item.medicineId) === id ? { ...item, quantity: newQty } : item
        )
      );
      toast(`Updated quantity for ${medicine.name || "item"} (${newQty})`, { variant: "info" });
    } else {
      setCart((prev) => [
        ...prev,
        {
          medicineId: id,
          name: medicine.name || medicine.medicine_name || `Medicine #${id}`,
          price: Number(medicine.price || medicine.unit_price || 0),
          quantity: qty,
          requires_prescription: Boolean(medicine.requires_prescription),
          description: medicine.description || "",
        },
      ]);
      toast(`Added ${medicine.name || "item"} to cart`, { variant: "success" });
    }
  };

  const removeFromCart = (medicineId) => {
    const id = Number(medicineId);
    setCart((prev) => prev.filter((item) => Number(item.medicineId) !== id));
    toast("Item removed from cart", { variant: "info" });
  };

  const updateQuantity = (medicineId, quantity) => {
    const id = Number(medicineId);
    const newQty = Math.max(1, Number(quantity) || 1);
    setCart((prev) =>
      prev.map((item) => (Number(item.medicineId) === id ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.quantity || 0) * Number(item.price || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
