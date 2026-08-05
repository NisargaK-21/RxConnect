"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getUser } from "@/utils/auth";

export default function SubstitutionTestPage() {
 const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const user = getUser();
  const customerId = user?.id;

  const [substitution, setSubstitution] = useState(null);

  const normalizedSuggestion = (sub) => {
    if (!sub) return {};
    if (sub.branchSuggestion || sub.medicineSuggestion || sub.medicineOtherBranchSuggestion) {
      return sub;
    }
    const branchSuggestion = sub.suggestionOptions?.find((opt) => opt.type === "same_medicine_other_branch");
    const medicineSuggestion = sub.suggestionOptions?.find((opt) => opt.type === "substitute_same_branch");
    const medicineOtherBranchSuggestion = sub.suggestionOptions?.find((opt) => opt.type === "substitute_other_branch");
    return {
      ...sub,
      branchSuggestion,
      medicineSuggestion,
      medicineOtherBranchSuggestion,
    };
  };

useEffect(() => {
  const data = localStorage.getItem("substitutionData");

  if (data) {
    setSubstitution(JSON.parse(data));
  }
}, []);
    const acceptChoice = async (selectedBranchId, selectedMedicineId) => {
    if (!substitution) return;

    const normalized = normalizedSuggestion(substitution);

    setLoading(true);

    try {
      const branchIdNumber = Number(selectedBranchId);
      const medicineIdNumber = Number(selectedMedicineId);

    if (!Number.isFinite(branchIdNumber) || !Number.isFinite(medicineIdNumber)) {
      setMessage("Invalid substitution choice selected.");
      setMessageType("error");
      return;
    }

    const response = await api.patch(
        `/orders/${substitution.orderId}/accept-substitution`,
        {
          orderItemId: Number(substitution.orderItemId),
          branchId: branchIdNumber,
          medicineId: medicineIdNumber,
        }
      );

      const data = response.data;

      if (response.status === 200) {
        setMessage(data.message || "Substitution accepted successfully.");
        setMessageType("success");
        localStorage.removeItem("substitutionData");
        router.push(`/orders?customerId=${customerId || 1}`);
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
      const response = await api.patch(
        `/orders/${substitution.orderId}/reject-substitution`,
        {
          orderItemId: substitution.orderItemId,
        }
      );

      const data = response.data;

      if (response.status === 200) {
        setMessage(data.message || "Substitution rejected.");
        setMessageType("success");
        localStorage.removeItem("substitutionData");
        router.push(`/orders?customerId=${customerId || 1}`);
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
  Medicine Substitution
</h1>

    

  
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
        {(normalizedSuggestion(substitution).branchSuggestion || substitution.branchSuggestion) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-5">

            <h3 className="text-xl font-semibold text-blue-700 mb-3">
              🏥 Option 1 - Same Medicine at Another Branch
            </h3>

            <p>
              <strong>Branch:</strong>{" "}
              {normalizedSuggestion(substitution).branchSuggestion?.branchName || substitution.branchSuggestion?.branchName}
            </p>

            <p>
              <strong>Available Quantity:</strong>{" "}
              {normalizedSuggestion(substitution).branchSuggestion?.availableQuantity || substitution.branchSuggestion?.availableQuantity}
            </p>

            <button
              onClick={() =>
                acceptChoice(
                  normalizedSuggestion(substitution).branchSuggestion?.branchId,
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
        {(normalizedSuggestion(substitution).medicineSuggestion || substitution.medicineSuggestion) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-5">

            <h3 className="text-xl font-semibold text-green-700 mb-3">
              💊 Option 2 - Substitute Medicine
            </h3>

            <p>
              <strong>Medicine:</strong>{" "}
              {normalizedSuggestion(substitution).medicineSuggestion?.name || substitution.medicineSuggestion?.name}
            </p>

            <p>
              <strong>Price:</strong> ₹
              {normalizedSuggestion(substitution).medicineSuggestion?.price || substitution.medicineSuggestion?.price}
            </p>

            <p>
              <strong>Available Quantity:</strong>{" "}
              {normalizedSuggestion(substitution).medicineSuggestion?.availableQuantity || substitution.medicineSuggestion?.availableQuantity}
            </p>

            <button
              onClick={() =>
                acceptChoice(
                  substitution.originalBranchId,
                  normalizedSuggestion(substitution).medicineSuggestion?.id
                )
              }
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
            >
              Use Substitute Medicine
            </button>

          </div>
        )}
                {/* Option 3 - Substitute Medicine at Another Branch */}
        {(normalizedSuggestion(substitution).medicineOtherBranchSuggestion || substitution.medicineOtherBranchSuggestion) && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-5">

            <h3 className="text-xl font-semibold text-purple-700 mb-3">
              💊🏥 Option 3 - Substitute Medicine at Another Branch
            </h3>

            <p>
              <strong>Medicine:</strong>{" "}
              {normalizedSuggestion(substitution).medicineOtherBranchSuggestion?.name || substitution.medicineOtherBranchSuggestion?.name}
            </p>

            <p>
              <strong>Branch:</strong>{" "}
              {normalizedSuggestion(substitution).medicineOtherBranchSuggestion?.branchName || substitution.medicineOtherBranchSuggestion?.branchName}
            </p>

            <p>
              <strong>Price:</strong> ₹
              {normalizedSuggestion(substitution).medicineOtherBranchSuggestion?.price || substitution.medicineOtherBranchSuggestion?.price}
            </p>

            <p>
              <strong>Available Quantity:</strong>{" "}
              {normalizedSuggestion(substitution).medicineOtherBranchSuggestion?.availableQuantity || substitution.medicineOtherBranchSuggestion?.availableQuantity}
            </p>

            <button
              onClick={() =>
                acceptChoice(
                  normalizedSuggestion(substitution).medicineOtherBranchSuggestion?.branchId,
                  normalizedSuggestion(substitution).medicineOtherBranchSuggestion?.id
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