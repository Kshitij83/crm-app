import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@crm-app.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@crm-app.com',
      authProvider: 'google',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'marketer@crm-app.com' },
    update: {},
    create: {
      name: 'Marketing Manager',
      email: 'marketer@crm-app.com',
      authProvider: 'google',
    },
  });

  console.log('✅ Users created');

  // Create sample customers
  const customers = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0101',
      totalSpend: 2500.00,
      visits: 15,
      lastActiveDate: new Date('2024-01-15'),
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0102',
      totalSpend: 1800.50,
      visits: 8,
      lastActiveDate: new Date('2024-01-10'),
    },
    {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1-555-0103',
      totalSpend: 3200.75,
      visits: 22,
      lastActiveDate: new Date('2024-01-20'),
    },
    {
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      phone: '+1-555-0104',
      totalSpend: 950.25,
      visits: 5,
      lastActiveDate: new Date('2023-12-15'),
    },
    {
      name: 'Charlie Wilson',
      email: 'charlie.wilson@example.com',
      phone: '+1-555-0105',
      totalSpend: 4500.00,
      visits: 30,
      lastActiveDate: new Date('2024-01-22'),
    },
    {
      name: 'Diana Davis',
      email: 'diana.davis@example.com',
      phone: '+1-555-0106',
      totalSpend: 1200.00,
      visits: 6,
      lastActiveDate: new Date('2023-11-20'),
    },
    {
      name: 'Eve Miller',
      email: 'eve.miller@example.com',
      phone: '+1-555-0107',
      totalSpend: 2800.50,
      visits: 12,
      lastActiveDate: new Date('2024-01-18'),
    },
    {
      name: 'Frank Garcia',
      email: 'frank.garcia@example.com',
      phone: '+1-555-0108',
      totalSpend: 1500.75,
      visits: 9,
      lastActiveDate: new Date('2024-01-12'),
    },
  ];

  const createdCustomers = [];
  for (const customerData of customers) {
    const customer = await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: customerData,
    });
    createdCustomers.push(customer);
  }

  console.log('✅ Customers created');

  // Create sample orders
  const orders = [
    { customerId: createdCustomers[0].id, orderAmount: 150.00, orderDate: new Date('2024-01-15') },
    { customerId: createdCustomers[0].id, orderAmount: 200.00, orderDate: new Date('2024-01-10') },
    { customerId: createdCustomers[1].id, orderAmount: 75.50, orderDate: new Date('2024-01-10') },
    { customerId: createdCustomers[2].id, orderAmount: 300.75, orderDate: new Date('2024-01-20') },
    { customerId: createdCustomers[2].id, orderAmount: 250.00, orderDate: new Date('2024-01-18') },
    { customerId: createdCustomers[3].id, orderAmount: 95.25, orderDate: new Date('2023-12-15') },
    { customerId: createdCustomers[4].id, orderAmount: 500.00, orderDate: new Date('2024-01-22') },
    { customerId: createdCustomers[4].id, orderAmount: 400.00, orderDate: new Date('2024-01-20') },
    { customerId: createdCustomers[5].id, orderAmount: 200.00, orderDate: new Date('2023-11-20') },
    { customerId: createdCustomers[6].id, orderAmount: 180.50, orderDate: new Date('2024-01-18') },
    { customerId: createdCustomers[7].id, orderAmount: 120.75, orderDate: new Date('2024-01-12') },
  ];

  for (const orderData of orders) {
    await prisma.order.upsert({
      where: { 
        id: `${orderData.customerId}-${orderData.orderDate.getTime()}` 
      },
      update: {},
      create: orderData,
    });
  }

  console.log('✅ Orders created');

  // Create sample segments
  const segments = [
    {
      name: 'High Value Customers',
      rules: {
        operator: 'AND',
        rules: [
          { field: 'totalSpend', operator: '>', value: 2000 },
        ],
      },
      createdBy: user1.id,
    },
    {
      name: 'Frequent Visitors',
      rules: {
        operator: 'AND',
        rules: [
          { field: 'visits', operator: '>', value: 10 },
        ],
      },
      createdBy: user1.id,
    },
    {
      name: 'Inactive Customers',
      rules: {
        operator: 'AND',
        rules: [
          { field: 'lastActiveDate', operator: '<', value: 30 },
        ],
      },
      createdBy: user2.id,
    },
    {
      name: 'VIP Customers',
      rules: {
        operator: 'AND',
        rules: [
          { field: 'totalSpend', operator: '>', value: 3000 },
          { field: 'visits', operator: '>', value: 15 },
        ],
      },
      createdBy: user1.id,
    },
  ];

  const createdSegments = [];
  for (const segmentData of segments) {
    const segment = await prisma.segment.upsert({
      where: { 
        id: `${segmentData.name.toLowerCase().replace(/\s+/g, '-')}-${segmentData.createdBy}` 
      },
      update: {},
      create: segmentData,
    });
    createdSegments.push(segment);
  }

  console.log('✅ Segments created');

  // Create sample campaigns
  const campaigns = [
    {
      segmentId: createdSegments[0].id,
      messageText: 'Thank you for being a valued customer! Enjoy 20% off your next purchase with code VIP20.',
      status: 'sent',
      createdBy: user1.id,
    },
    {
      segmentId: createdSegments[1].id,
      messageText: 'We miss you! Come back and discover our latest products with free shipping.',
      status: 'sent',
      createdBy: user2.id,
    },
    {
      segmentId: createdSegments[2].id,
      messageText: 'Welcome back! We have exciting new arrivals just for you.',
      status: 'draft',
      createdBy: user1.id,
    },
  ];

  const createdCampaigns = [];
  for (const campaignData of campaigns) {
    const campaign = await prisma.campaign.upsert({
      where: { 
        id: `${campaignData.segmentId}-${campaignData.createdBy}-${Date.now()}` 
      },
      update: {},
      create: campaignData,
    });
    createdCampaigns.push(campaign);
  }

  console.log('✅ Campaigns created');

  // Create sample communication logs
  const communicationLogs = [];
  for (const campaign of createdCampaigns) {
    if (campaign.status === 'sent') {
      // Get customers for this campaign's segment
      const segment = createdSegments.find(s => s.id === campaign.segmentId);
      if (segment) {
        // Simulate sending to some customers
        const customersToSend = createdCustomers.slice(0, 3);
        for (const customer of customersToSend) {
          const isSuccess = Math.random() < 0.9; // 90% success rate
          const log = await prisma.communicationLog.create({
            data: {
              campaignId: campaign.id,
              customerId: customer.id,
              status: isSuccess ? 'SENT' : 'FAILED',
              sentAt: new Date(),
            },
          });
          communicationLogs.push(log);
        }
      }
    }
  }

  console.log('✅ Communication logs created');

  console.log('🎉 Database seed completed successfully!');
  console.log(`
📊 Summary:
- Users: 2
- Customers: ${createdCustomers.length}
- Orders: ${orders.length}
- Segments: ${createdSegments.length}
- Campaigns: ${createdCampaigns.length}
- Communication Logs: ${communicationLogs.length}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

