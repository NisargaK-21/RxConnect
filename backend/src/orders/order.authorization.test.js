const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { fetchCustomerOrders, fetchOrderById, updateOrderBranch } = require("./order.controller");

describe("Authorization and IDOR Prevention Middleware Tests", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.JWT_SECRET = JWT_SECRET;

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test("authenticate middleware: rejects request without token with 401", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access token is missing" });
    expect(next).not.toHaveBeenCalled();
  });

  test("authenticate middleware: accepts valid token", () => {
    const token = jwt.sign({ id: 101, role: "customer" }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(101);
    expect(req.user.role).toBe("customer");
    expect(next).toHaveBeenCalled();
  });

  test("authorize middleware: blocks unauthorized roles with 403", () => {
    const middleware = authorize("admin", "pharmacist");
    const req = { user: { id: 101, role: "customer" } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: You do not have permission to access this resource",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("authorize middleware: allows authorized roles", () => {
    const middleware = authorize("admin", "pharmacist");
    const req = { user: { id: 201, role: "pharmacist" } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("IDOR check: customer fetching another customer's orders gets 403", async () => {
    const req = {
      user: { id: 100, role: "customer" },
      params: { customerId: "200" },
    };
    const res = mockRes();

    await fetchCustomerOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: You cannot access another user's orders",
    });
  });

  test("IDOR check: customer modifying another user's order branch gets 403", async () => {
    const req = {
      user: { id: 100, role: "customer" },
      params: { id: "999" },
      body: { branchId: 2 },
    };
    const res = mockRes();

    // Mock order service to return order belonging to customer 200
    const orderService = require("./order.service");
    jest.spyOn(orderService, "getOrderById").mockResolvedValueOnce({
      success: true,
      order: { id: 999, customer_id: 200, branch_id: 1 },
      items: [],
    });

    await updateOrderBranch(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: You cannot modify another user's order",
    });
  });
});
