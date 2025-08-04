import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the 4-digit code generation function (same as in auth config)
    const generateVerificationToken = async () => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };
    
    const token = await generateVerificationToken();
    
    return NextResponse.json({
      message: 'Test token generated successfully',
      token: token,
      tokenLength: token.length,
      isNumeric: /^\d+$/.test(token)
    });
  } catch (error) {
    console.error('Test token generation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}