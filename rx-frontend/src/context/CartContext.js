"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "@/components/Toast";

const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  replaceItemWithSubstitute: () => {},
  clearCart: () => {},
  selectedBranchId: "",
  setSelectedBranchId: () => {},
  cartCount: 0,
  cartTotal: 0,
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rx_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
      const savedBranch = localStorage.getItem("rx_selected_branch");
      if (savedBranch) {
        setSelectedBranchId(savedBranch);
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

  useEffect(() => {
    if (isLoaded && selectedBranchId) {
      try {
        localStorage.setItem("rx_selected_branch", selectedBranchId);
      } catch (e) {
        console.error("Failed to save branch to localStorage", e);
      }
    }
  }, [selectedBranchId, isLoaded]);

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

  const replaceItemWithSubstitute = (originalMedicineId, substituteMedicine) => {
    const origId = Number(originalMedicineId);
    const subId = Number(substituteMedicine.id);
    setCart((prev) =>
      prev.map((item) => {
        if (Number(item.medicineId) === origId) {
          return {
            ...item,
            medicineId: subId,
            name: substituteMedicine.name || substituteMedicine.medicine_name || `Medicine #${subId}`,
            price: Number(substituteMedicine.price || substituteMedicine.unit_price || item.price || 0),
            requires_prescription: Boolean(substituteMedicine.requires_prescription ?? item.requires_prescription),
          };
        }
        return item;
      })
    );
    toast(`Replaced with substitute medicine (${substituteMedicine.name})`, { variant: "success" });
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
        replaceItemWithSubstitute,
        clearCart,
        selectedBranchId,
        setSelectedBranchId,
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

