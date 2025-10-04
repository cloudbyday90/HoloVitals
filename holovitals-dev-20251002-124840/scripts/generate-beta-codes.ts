import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BetaCodeOptions {
  count: number;
  expiresInDays?: number;
  maxRedemptions?: number;
}

function generateBetaCode(): string {
  const randomBytes = crypto.randomBytes(4);
  const code = randomBytes.toString('hex').toUpperCase();
  return `HOLO-${code}`;
}

async function generateBetaCodes(options: BetaCodeOptions) {
  const { count, expiresInDays = 90, maxRedemptions = 1 } = options;
  
  console.log(`\n🚀 Generating ${count} beta codes...\n`);
  
  const codes: Array<{
    code: string;
    maxRedemptions: number;
    expiresAt: Date;
  }> = [];
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // Generate unique codes
  const existingCodes = new Set(
    (await prisma.betaCode.findMany({ select: { code: true } })).map(c => c.code)
  );
  
  while (codes.length < count) {
    const code = generateBetaCode();
    if (!existingCodes.has(code)) {
      codes.push({
        code,
        maxRedemptions,
        expiresAt,
      });
      existingCodes.add(code);
    }
  }
  
  // Insert codes into database
  const result = await prisma.betaCode.createMany({
    data: codes,
  });
  
  console.log(`✅ Created ${result.count} beta codes in database\n`);
  
  // Export to CSV
  const csvContent = [
    'Code,Max Redemptions,Expires At,Status',
    ...codes.map(c => `${c.code},${c.maxRedemptions},${c.expiresAt.toISOString()},Active`)
  ].join('\n');
  
  const outputDir = path.join(process.cwd(), 'beta-codes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `beta-codes-${timestamp}.csv`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, csvContent);
  
  console.log(`📄 Exported codes to: ${filepath}\n`);
  
  // Display sample codes
  console.log('📋 Sample codes (first 10):');
  console.log('─'.repeat(50));
  codes.slice(0, 10).forEach((c, i) => {
    console.log(`${i + 1}. ${c.code}`);
  });
  console.log('─'.repeat(50));
  console.log(`\n💡 Total codes generated: ${codes.length}`);
  console.log(`📅 Expiration date: ${expiresAt.toLocaleDateString()}`);
  console.log(`🔄 Max redemptions per code: ${maxRedemptions}\n`);
  
  return codes;
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const countArg = args.find(arg => arg.startsWith('--count='));
    const expiresArg = args.find(arg => arg.startsWith('--expires='));
    
    const count = countArg ? parseInt(countArg.split('=')[1]) : 100;
    const expiresInDays = expiresArg ? parseInt(expiresArg.split('=')[1]) : 90;
    
    await generateBetaCodes({
      count,
      expiresInDays,
      maxRedemptions: 1,
    });
    
    console.log('✨ Beta code generation complete!\n');
  } catch (error) {
    console.error('❌ Error generating beta codes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();