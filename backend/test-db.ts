/**
 * Simple test script to verify database connection and seed data
 * Run with Node.js: npx ts-node test-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing database connection and schema...');
  console.log('----------------------------------------');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check users
    const userCount = await prisma.user.count();
    console.log(`Users in database: ${userCount}`);
    if (userCount > 0) {
      const users = await prisma.user.findMany({ take: 3 });
      console.log('Sample users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
    }

    // Check customers
    const customerCount = await prisma.customer.count();
    console.log(`Customers in database: ${customerCount}`);
    if (customerCount > 0) {
      const customers = await prisma.customer.findMany({ take: 3 });
      console.log('Sample customers:', customers.map(c => ({ id: c.id, name: c.name, email: c.email })));
    }

    // Check segments
    const segmentCount = await prisma.segment.count();
    console.log(`Segments in database: ${segmentCount}`);
    if (segmentCount > 0) {
      const segments = await prisma.segment.findMany({ take: 3 });
      console.log('Sample segments:', segments.map(s => ({ id: s.id, name: s.name })));
    }

    // Check campaigns
    const campaignCount = await prisma.campaign.count();
    console.log(`Campaigns in database: ${campaignCount}`);
    if (campaignCount > 0) {
      const campaigns = await prisma.campaign.findMany({ take: 3 });
      console.log('Sample campaigns:', campaigns.map(c => ({ id: c.id, status: c.status })));
    }

    // Check orders
    const orderCount = await prisma.order.count();
    console.log(`Orders in database: ${orderCount}`);
    if (orderCount > 0) {
      const orders = await prisma.order.findMany({ take: 3 });
      console.log('Sample orders:', orders.map(o => ({ id: o.id, amount: o.orderAmount })));
    }

    console.log('----------------------------------------');
    console.log('🎉 Database tests completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();