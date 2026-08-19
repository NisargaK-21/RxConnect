const { fetchMedicineSubstitutions } = require("../catalog/catalog.controller");
const { verifyPrescription } = require("./prescription.controller");
const catalogService = require("../catalog/catalog.service");
const prescriptionService = require("./prescription.service");

describe("Substitutions and Prescription Verification API Unit Tests", () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test("fetchMedicineSubstitutions: returns substitution list", async () => {
    const req = {
      params: { id: "10" },
      query: { branchId: "1" },
    };
    const res = mockRes();

    jest.spyOn(catalogService, "getMedicineSubstitutions").mockResolvedValueOnce([
      { id: 20, name: "Sub Medicine A", price: 15.0, available_quantity: 50 },
    ]);

    await fetchMedicineSubstitutions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        { id: 20, name: "Sub Medicine A", price: 15.0, available_quantity: 50 },
      ],
    });
  });

  test("verifyPrescription: successfully verifies prescription with status = approved", async () => {
    const req = {
      params: { id: "55" },
      body: { status: "approved" },
      user: { id: 301, role: "pharmacist" },
    };
    const res = mockRes();

    jest.spyOn(prescriptionService, "reviewPrescription").mockResolvedValueOnce({
      id: 55,
      status: "approved",
      reviewed_by: 301,
    });

    await verifyPrescription(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Prescription approved successfully",
      data: { id: 55, status: "approved", reviewed_by: 301 },
    });
  });

  test("verifyPrescription: successfully rejects prescription with verified = false", async () => {
    const req = {
      params: { id: "55" },
      body: { verified: false },
      user: { id: 301, role: "pharmacist" },
    };
    const res = mockRes();

    jest.spyOn(prescriptionService, "reviewPrescription").mockResolvedValueOnce({
      id: 55,
      status: "rejected",
      reviewed_by: 301,
    });

    await verifyPrescription(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Prescription rejected successfully",
      data: { id: 55, status: "rejected", reviewed_by: 301 },
    });
  });

  test("verifyPrescription: rejects invalid status payload with 400", async () => {
    const req = {
      params: { id: "55" },
      body: { status: "invalid_status" },
      user: { id: 301, role: "pharmacist" },
    };
    const res = mockRes();

    await verifyPrescription(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Status, decision, or action must be approved/verified or rejected",
    });
  });
});
