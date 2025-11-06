import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Vérifier si l'utilisateur admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  let admin;

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    admin = existingAdmin;
  } else {
    // Créer l'utilisateur admin par défaut
    const hashedPassword = await bcrypt.hash('passwordAdmin', 10);

    admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    });

    console.log('✅ Admin user created:');
    console.log('   Username: admin');
    console.log('   Password: passwordAdmin');
    console.log('   ID:', admin.id);
  }

  // Créer un service de test avec une API key
  const testServiceName = 'test-service';
  const existingTestApiKey = await prisma.apiKey.findFirst({
    where: {
      service: testServiceName,
      createdById: admin.id
    },
  });

  let testApiKey;

  if (existingTestApiKey) {
    console.log('✅ Test service API key already exists');
    testApiKey = existingTestApiKey;
  } else {
    const apiKeyValue = `avl_test_${crypto.randomBytes(32).toString('hex')}`;

    testApiKey = await prisma.apiKey.create({
      data: {
        name: 'Test Service Key',
        key: apiKeyValue,
        service: testServiceName,
        isActive: true,
        createdById: admin.id,
      },
    });

    console.log('✅ Test service API key created:');
    console.log('   Service:', testServiceName);
    console.log('   API Key:', apiKeyValue);
    console.log('   Name:', testApiKey.name);
  }

  // Créer des erreurs de démo
  const existingDemoErrors = await prisma.errorEvent.count({
    where: { service: testServiceName },
  });

  if (existingDemoErrors > 0) {
    console.log('✅ Demo errors already exist');
  } else {
    const demoErrors = [
      {
        service: testServiceName,
        message: 'Database connection timeout',
        stack: `Error: Database connection timeout
    at DatabaseService.connect (database.service.ts:45:15)
    at async main (index.ts:12:5)`,
        path: '/api/users',
        method: 'GET',
        level: 'error',
        metadata: {
          user: 'demo_user',
          timeout: 5000,
          database: 'postgres',
        },
      },
      {
        service: testServiceName,
        message: 'Invalid authentication token',
        stack: `Error: Invalid authentication token
    at AuthMiddleware.verify (auth.middleware.ts:23:11)
    at Layer.handle (router.ts:95:5)`,
        path: '/api/profile',
        method: 'POST',
        level: 'warning',
        metadata: {
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      },
      {
        service: testServiceName,
        message: 'Payment processing failed',
        stack: `Error: Payment processing failed
    at PaymentService.processPayment (payment.service.ts:78:9)
    at OrderController.checkout (order.controller.ts:34:21)`,
        path: '/api/orders/checkout',
        method: 'POST',
        level: 'error',
        metadata: {
          orderId: 'ORD-12345',
          amount: 99.99,
          currency: 'EUR',
          provider: 'stripe',
        },
      },
      {
        service: testServiceName,
        message: 'File upload size exceeded',
        stack: `Error: File upload size exceeded
    at UploadMiddleware.checkSize (upload.middleware.ts:15:13)
    at multer (multer.ts:89:7)`,
        path: '/api/upload',
        method: 'POST',
        level: 'warning',
        metadata: {
          fileSize: 10485760,
          maxSize: 5242880,
          fileName: 'document.pdf',
        },
      },
      {
        service: testServiceName,
        message: 'Rate limit exceeded',
        stack: `Error: Rate limit exceeded
    at RateLimitMiddleware.check (ratelimit.middleware.ts:30:9)
    at Layer.handle (router.ts:95:5)`,
        path: '/api/search',
        method: 'GET',
        level: 'warning',
        metadata: {
          ip: '203.0.113.45',
          requests: 105,
          limit: 100,
          window: '1 minute',
        },
      },
    ];

    await prisma.errorEvent.createMany({
      data: demoErrors,
    });

    console.log(`✅ Created ${demoErrors.length} demo errors for ${testServiceName}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
