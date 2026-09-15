import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { app, server } from "./index.js";

dotenv.config();

const BASE_URL = "http://127.0.0.1:3000";

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    console.log("Running comprehensive backend tests...\n");

    // 1. Test Admin Login
    const adminRes = await axios.post(`${BASE_URL}/api/user/login`, {
      email: "admin@apnabazaar.com",
      password: "admin123"
    });
    assert(adminRes.data.success === true && adminRes.data.user.role === "admin", "Admin Login");
    const adminToken = adminRes.data.token;

    // 2. Test Customer Login
    const customerRes = await axios.post(`${BASE_URL}/api/user/login`, {
      email: "customer@apnabazaar.com",
      password: "password123"
    });
    assert(customerRes.data.success === true && customerRes.data.user.role === "customer", "Customer Login");
    const customerToken = customerRes.data.token;

    // 3. Test Vendor Login
    const vendorRes = await axios.post(`${BASE_URL}/api/user/login`, {
      email: "vendor@apnabazaar.com",
      password: "vendor123"
    });
    assert(vendorRes.data.success === true && vendorRes.data.user.role === "vendor", "Vendor Login");

    // 4. Test AuthCheck with Bearer Token
    const authCheckRes = await axios.get(`${BASE_URL}/api/user/authcheck`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(authCheckRes.data.isAuthenticate === true, "AuthCheck via Bearer token");

    // 5. Test Admin AuthCheck with Bearer Token
    const adminAuthRes = await axios.get(`${BASE_URL}/api/admin/authcheck`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAuthRes.data.isAuthenticate === true && adminAuthRes.data.role === "admin", "Admin AuthCheck via Bearer token");

    // 6. Test Product Search (Multilingual / nested name fix)
    const searchWheat = await axios.get(`${BASE_URL}/api/product/search?name=Wheat`);
    assert(searchWheat.data.success === true && searchWheat.data.data.length > 0, "Search Products for 'Wheat'");

    const searchRice = await axios.get(`${BASE_URL}/api/product/search?name=Rice`);
    assert(searchRice.data.success === true && searchRice.data.data.length > 0, "Search Products for 'Rice'");

    // 7. Test Admin get products
    const adminProductsRes = await axios.get(`${BASE_URL}/api/admin/getproduct`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminProductsRes.data.success === true && adminProductsRes.data.products.length > 0, "Admin Get Products");

    // 8. Test Admin get all users
    const adminUsersRes = await axios.get(`${BASE_URL}/api/admin/getallusers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsersRes.data.success === true && adminUsersRes.data.users.length > 0, "Admin Get All Users");

    // 9. Test Admin dashboard details
    const dashboardRes = await axios.get(`${BASE_URL}/api/admin/dashboarddetail`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(dashboardRes.data.success === true && typeof dashboardRes.data.totalOrder === "number", "Admin Dashboard Details");

    // 10. Test CreateOrder validation
    try {
      await axios.post(`${BASE_URL}/api/order/create`, { items: [] }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(false, "CreateOrder should reject empty cart");
    } catch (err) {
      assert(err.response?.status === 400, "CreateOrder rejects empty cart with 400");
    }

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error("Test execution error:", error.response?.data || error.message);
    process.exit(1);
  }
};

// Give server time to initialize if needed
setTimeout(runTests, 2000);
