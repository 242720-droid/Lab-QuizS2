/**
 * Automated Test Script for Online Food Ordering System
 * Tests:
 * 1. GET /restaurants
 * 2. POST /restaurants
 * 3. ApiKeyGuard validation (missing key -> 401, invalid key -> 401, valid key -> 200)
 * 4. DTO ValidationPipe (empty name -> 400, negative price -> 400)
 * 5. POST /menu-items (valid creation)
 * 6. GET /menu-items and GET /menu-items/:id
 * 7. PATCH /menu-items/:id
 * 8. DELETE /menu-items/:id
 * 9. One-to-Many & Many-to-One relationship verification
 */

require('dotenv').config();

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
const API_KEY = process.env.API_KEY || 'food-quiz-secret-key-2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Online Food Ordering System API Tests');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   API Key: ${API_KEY}`);
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: POST /restaurants (Create a Restaurant)
    // ----------------------------------------------------
    console.log('▶ Test 1: POST /restaurants');
    const restPayload = {
      name: `Test Bistro ${Date.now()}`,
      address: '742 Evergreen Terrace',
      cuisine: 'Italian & Grills',
      phone: '+1-555-8899',
    };

    const createRestRes = await fetch(`${BASE_URL}/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restPayload),
    });
    const createdRestaurant = await createRestRes.json();
    assert(createRestRes.status === 201, `Status is 201 Created (got ${createRestRes.status})`);
    assert(createdRestaurant.id !== undefined, `Restaurant assigned ID: ${createdRestaurant.id}`);
    assert(createdRestaurant.name === restPayload.name, `Restaurant name matches: "${createdRestaurant.name}"`);

    const restaurantId = createdRestaurant.id;

    // ----------------------------------------------------
    // TEST 2: GET /restaurants (List all Restaurants)
    // ----------------------------------------------------
    console.log('\n▶ Test 2: GET /restaurants');
    const getRestsRes = await fetch(`${BASE_URL}/restaurants`);
    const allRestaurants = await getRestsRes.json();
    assert(getRestsRes.status === 200, `Status is 200 OK (got ${getRestsRes.status})`);
    assert(Array.isArray(allRestaurants), 'Response is an array of restaurants');
    assert(allRestaurants.some((r) => r.id === restaurantId), 'Newly created restaurant found in list');

    // ----------------------------------------------------
    // TEST 3: GUARD - Missing x-api-key Header (Expect 401)
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Guard Verification - Missing x-api-key (Expect 401)');
    const guardNoKeyRes = await fetch(`${BASE_URL}/menu-items`);
    assert(
      guardNoKeyRes.status === 401,
      `Guard rejected missing key with status 401 (got ${guardNoKeyRes.status})`,
    );

    // ----------------------------------------------------
    // TEST 4: GUARD - Invalid x-api-key Header (Expect 401)
    // ----------------------------------------------------
    console.log('\n▶ Test 4: Guard Verification - Invalid x-api-key (Expect 401)');
    const guardBadKeyRes = await fetch(`${BASE_URL}/menu-items`, {
      headers: { 'x-api-key': 'completely-wrong-key' },
    });
    assert(
      guardBadKeyRes.status === 401,
      `Guard rejected invalid key with status 401 (got ${guardBadKeyRes.status})`,
    );

    // ----------------------------------------------------
    // TEST 5: DTO Validation - Empty Name (Expect 400)
    // ----------------------------------------------------
    console.log('\n▶ Test 5: DTO Validation - Empty Name (Expect 400)');
    const emptyNameRes = await fetch(`${BASE_URL}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        name: '',
        price: 9.99,
        category: 'Fast Food',
        restaurantId,
      }),
    });
    assert(
      emptyNameRes.status === 400,
      `ValidationPipe rejected empty name with status 400 (got ${emptyNameRes.status})`,
    );

    // ----------------------------------------------------
    // TEST 6: DTO Validation - Negative Price (Expect 400)
    // ----------------------------------------------------
    console.log('\n▶ Test 6: DTO Validation - Negative Price (Expect 400)');
    const negativePriceRes = await fetch(`${BASE_URL}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        name: 'Negative Price Item',
        price: -15.5,
        category: 'Fast Food',
        restaurantId,
      }),
    });
    assert(
      negativePriceRes.status === 400,
      `ValidationPipe rejected negative price with status 400 (got ${negativePriceRes.status})`,
    );

    // ----------------------------------------------------
    // TEST 7: POST /menu-items (Valid Creation)
    // ----------------------------------------------------
    console.log('\n▶ Test 7: POST /menu-items (Valid Data with x-api-key)');
    const itemPayload = {
      name: 'Truffle Mushroom Pizza',
      description: 'Thin crust sourdough with truffle oil and wild mushrooms.',
      price: 18.5,
      category: 'Pizza & Pasta',
      restaurantId,
      isAvailable: true,
    };
    const createItemRes = await fetch(`${BASE_URL}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(itemPayload),
    });
    const createdItem = await createItemRes.json();
    assert(createItemRes.status === 201, `Status is 201 Created (got ${createItemRes.status})`);
    assert(createdItem.id !== undefined, `MenuItem assigned ID: ${createdItem.id}`);
    assert(Number(createdItem.price) === 18.5, `Price correctly stored as 18.50`);
    assert(createdItem.restaurantId === restaurantId, `Belongs to restaurant ID: ${restaurantId}`);

    const menuItemId = createdItem.id;

    // ----------------------------------------------------
    // TEST 8: GET /menu-items/:id
    // ----------------------------------------------------
    console.log(`\n▶ Test 8: GET /menu-items/${menuItemId}`);
    const getItemRes = await fetch(`${BASE_URL}/menu-items/${menuItemId}`, {
      headers: { 'x-api-key': API_KEY },
    });
    const fetchedItem = await getItemRes.json();
    assert(getItemRes.status === 200, `Status is 200 OK (got ${getItemRes.status})`);
    assert(fetchedItem.name === itemPayload.name, 'Fetched item name matches');
    assert(fetchedItem.restaurant && fetchedItem.restaurant.id === restaurantId, 'Many-to-One restaurant relation loaded');

    // ----------------------------------------------------
    // TEST 9: PATCH /menu-items/:id
    // ----------------------------------------------------
    console.log(`\n▶ Test 9: PATCH /menu-items/${menuItemId}`);
    const patchPayload = {
      price: 19.99,
      description: 'Updated gourmet recipe with extra truffle sauce.',
    };
    const patchRes = await fetch(`${BASE_URL}/menu-items/${menuItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(patchPayload),
    });
    const updatedItem = await patchRes.json();
    assert(patchRes.status === 200, `Status is 200 OK (got ${patchRes.status})`);
    assert(Number(updatedItem.price) === 19.99, `Price updated to $19.99`);
    assert(updatedItem.description === patchPayload.description, 'Description updated');

    // ----------------------------------------------------
    // TEST 10: Relationship Verification - One-to-Many
    // ----------------------------------------------------
    console.log('\n▶ Test 10: Relationship Verification - Restaurant has many MenuItems');
    const verifyRestRes = await fetch(`${BASE_URL}/restaurants/${restaurantId}`);
    const verifiedRest = await verifyRestRes.json();
    assert(
      Array.isArray(verifiedRest.menuItems) && verifiedRest.menuItems.length > 0,
      `Restaurant ID ${restaurantId} contains ${verifiedRest.menuItems?.length} menuItem(s) (One-to-Many relationship active)`,
    );

    // ----------------------------------------------------
    // TEST 11: DELETE /menu-items/:id
    // ----------------------------------------------------
    console.log(`\n▶ Test 11: DELETE /menu-items/${menuItemId}`);
    const deleteRes = await fetch(`${BASE_URL}/menu-items/${menuItemId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': API_KEY },
    });
    const deleteResult = await deleteRes.json();
    assert(deleteRes.status === 200, `Status is 200 OK (got ${deleteRes.status})`);
    assert(deleteResult.id === menuItemId, `Confirmed deletion for item ID ${menuItemId}`);

    // Verify deletion
    const verifyDelRes = await fetch(`${BASE_URL}/menu-items/${menuItemId}`, {
      headers: { 'x-api-key': API_KEY },
    });
    assert(verifyDelRes.status === 404, 'Item cannot be found after deletion (404 Not Found)');

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
