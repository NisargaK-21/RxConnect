"use client";

import { useState } from "react";

export default function SubstitutionTestPage() {
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [substitution, setSubstitution] = useState(null);
    const placeOrder = async () => {
    setLoading(true);
    setMessage("");
    setMessageType("");
    setSubstitution(null);

    try {
      const response = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: Number(customerId),
          branchId: Number(branchId),
          items: [
            {
              medicineId: Number(medicineId),
              quantity: Number(quantity),
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setMessage(data.message || "Order placed successfully.");
        setMessageType("success");
      } else if (response.status === 409) {
        setMessage(
          data.message ||
            "Medicine unavailable. Please choose one of the available substitution options."
        );
        setMessageType("warning");

        setSubstitution({
          orderId: data.orderId,
          orderItemId: data.orderItemId,

          originalBranchId: Number(branchId),
          originalMedicineId: Number(medicineId),

          branchSuggestion: data.branchSuggestion,
          medicineSuggestion: data.medicineSuggestion,
          medicineOtherBranchSuggestion:
            data.medicineOtherBranchSuggestion,
        });
      } else {
        setMessage(data.message || "Something went wrong.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };
    const acceptChoice = async (selectedBranchId, selectedMedicineId) => {
    if (!substitution) return;

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/orders/${substitution.orderId}/accept-substitution`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderItemId: substitution.orderItemId,
            branchId: selectedBranchId,
            medicineId: selectedMedicineId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Substitution accepted successfully.");
        setMessageType("success");
        setSubstitution(null);
      } else {
        setMessage(data.message || "Failed to accept substitution.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const rejectSubstitution = async () => {
    if (!substitution) return;

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/orders/${substitution.orderId}/reject-substitution`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderItemId: substitution.orderItemId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Substitution rejected.");
        setMessageType("success");
        setSubstitution(null);
      } else {
        setMessage(data.message || "Failed to reject substitution.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
  <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">

    <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
      Medicine Substitution Test
    </h1>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <input
        type="number"
        placeholder="Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="number"
        placeholder="Branch ID"
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="number"
        placeholder="Medicine ID"
        value={medicineId}
        onChange={(e) => setMedicineId(e.target.value)}
        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>

    <button
      onClick={placeOrder}
      disabled={loading}
      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
    >
      {loading ? "Processing..." : "Place Order"}
    </button>
        {message && (
      <div
        className={`mt-6 rounded-lg p-4 text-white font-medium ${
          messageType === "success"
            ? "bg-green-600"
            : messageType === "warning"
            ? "bg-yellow-500"
            : "bg-red-600"
        }`}
      >
        {message}
      </div>
    )}

    {substitution && (
      <div className="mt-10">

        <h2 className="text-2xl font-bold text-red-600 mb-6">
          ⚠ Medicine Unavailable
        </h2>

        <p className="text-gray-600 mb-6">
          Please choose one of the following substitution options.
        </p>
                {/* Option 1 - Same Medicine, Different Branch */}
        {substitution.branchSuggestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-5">

            <h3 className="text-xl font-semibold text-blue-700 mb-3">
              🏥 Option 1 - Same Medicine at Another Branch
            </h3>

            <p>
              <strong>Branch:</strong>{" "}
              {substitution.branchSuggestion.branchName}
            </p>

            <p>
              <strong>Available Quantity:</strong>{" "}
              {substitution.branchSuggestion.availableQuantity}
            </p>

            <button
              onClick={() =>
                acceptChoice(
                  substitution.branchSuggestion.branchId,
                  substitution.originalMedicineId
                )
              }
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Choose This Branch
            </button>

          </div>
        )}

        {/* Option 2 - Substitute Medicine */}
        {substitution.medicineSuggestion && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-5">

            <h3 className="text-xl font-semibold text-green-700 mb-3">
              💊 Option 2 - Substitute Medicine
            </h3>

            <p>
              <strong>Medicine:</strong>{" "}
              {substitution.medicineSuggestion.name}
            </p>

            <p>
              <strong>Price:</strong> ₹
              {substitution.medicineSuggestion.price}
            </p>

            <p>
              <strong>Available Quantity:</strong>{" "}
              {substitution.medicineSuggestion.availableQuantity}
            </p>

            <button
              onClick={() =>
                acceptChoice(
                  substitution.originalBranchId,
                  substitution.medicineSuggestion.id
                )
              }
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
            >
              Use Substitute Medicine
            </button>

          </div>
        )}
                {/* Option 3 - Substitute Medicine at Another Branch */}
        {substitution.medicineOtherBranchSuggestion && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-5">

            <h3 className="text-xl font-semibold text-purple-700 mb-3">
              💊🏥 Option 3 - Substitute Medicine at Another Branch
            </h3>

            <p>
              <strong>Medicine:</strong>{" "}
              {substitution.medicineOtherBranchSuggestion.name}
            </p>

            <p>
              <strong>Branch:</strong>{" "}
              {substitution.medicineOtherBranchSuggestion.branchName}
            </p>

            <p>
              <strong>Price:</strong> ₹
              {substitution.medicineOtherBranchSuggestion.price}
            </p>

            <p>
              <strong>Available Quantity:</strong>{" "}
              {substitution.medicineOtherBranchSuggestion.availableQuantity}
            </p>

            <button
              onClick={() =>
                acceptChoice(
                  substitution.medicineOtherBranchSuggestion.branchId,
                  substitution.medicineOtherBranchSuggestion.id
                )
              }
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg"
            >
              Use This Option
            </button>

          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={rejectSubstitution}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Reject Order
          </button>
        </div>

      </div>
    )}

  </div>
</div>
  );
}