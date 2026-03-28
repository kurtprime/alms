'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { FcGoogle } from 'react-icons/fc';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Phone, MapPin, HelpCircle, MessageCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ==========================================
// 1. AUTH FORM & CARD
// ==========================================

const SignInSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }).max(100),
  password: z.string().min(1, { message: 'Password is required' }).max(100),
});

const SignInEmailSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }).max(100),
});

type LoginMethod = 'username' | 'email';

function SignInForm() {
  const router = useRouter();

  // Define strict types
  type Step = 'credentials' | 'choose_method' | 'enter_code';
  type TwoFactorMethod = 'totp' | 'email';

  // Login method toggle: username or email
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('username');

  // Step Logic: credentials -> choose_method -> enter_code
  const [step, setStep] = useState<Step>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('login_step');
      // Type guard to ensure only valid steps are returned
      if (stored === 'credentials' || stored === 'choose_method' || stored === 'enter_code') {
        return stored;
      }
    }
    return 'credentials';
  });

  // Which method did they choose?
  const [method, setMethod] = useState<TwoFactorMethod | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('login_method');
      if (stored === 'totp' || stored === 'email') {
        return stored;
      }
    }
    return null;
  });

  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('login_email') || '';
    }
    return '';
  });

  // Username form
  const usernameForm = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { username: '', password: '' },
  });

  // Email form
  const emailForm = useForm<z.infer<typeof SignInEmailSchema>>({
    resolver: zodResolver(SignInEmailSchema),
    defaultValues: { email: '', password: '' },
  });

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('login_step', step);
    if (method) sessionStorage.setItem('login_method', method);
    if (email) sessionStorage.setItem('login_email', email);

    if (step === 'credentials') {
      sessionStorage.removeItem('login_method');
      sessionStorage.removeItem('login_email');
    }
  }, [step, method, email]);

  // --- STEP 1: Submit Credentials (Username) ---
  async function onSubmitUsername(values: z.infer<typeof SignInSchema>) {
    await authClient.signIn.username(
      {
        username: values.username.trim(),
        password: values.password,
        callbackURL: '/',
      },
      {
        async onSuccess(context) {
          if (context.data.twoFactorRedirect) {
            setEmail(values.username);
            setStep('choose_method');
          } else {
            router.push('/');
          }
        },
        onError(context) {
          toast.error('Sign In Failed', { description: context.error.message });
        },
      }
    );
  }

  // --- STEP 1: Submit Credentials (Email) ---
  async function onSubmitEmail(values: z.infer<typeof SignInEmailSchema>) {
    await authClient.signIn.email(
      {
        email: values.email.trim(),
        password: values.password,
        callbackURL: '/',
      },
      {
        async onSuccess(context) {
          if (context.data.twoFactorRedirect) {
            setEmail(values.email);
            setStep('choose_method');
          } else {
            router.push('/');
          }
        },
        onError(context) {
          toast.error('Sign In Failed', { description: context.error.message });
        },
      }
    );
  }

  const { isSubmitting: isSubmittingUsername } = usernameForm.formState;
  const { isSubmitting: isSubmittingEmail } = emailForm.formState;

  // --- STEP 2: Choose Method ---
  const handleChooseMethod = async (selectedType: TwoFactorMethod) => {
    setMethod(selectedType);
    setStep('enter_code');

    if (selectedType === 'email') {
      try {
        await authClient.twoFactor.sendOtp();
        toast.info('Code Sent', {
          description: 'Check your email for the code.',
        });
      } catch (e) {
        toast.error('Failed to send email');
      }
    }
  };

  // --- STEP 3: Verify Code ---
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify2FA = async () => {
    if (!code) return;
    setVerifying(true);

    let result;

    if (method === 'totp') {
      result = await authClient.twoFactor.verifyTotp({ code });
    } else {
      // Default to OTP (email) logic
      result = await authClient.twoFactor.verifyOtp({ code });
    }

    const { data, error } = result;

    if (error) {
      toast.error('Verification Failed', {
        description: error.message || 'Invalid code',
      });
    } else {
      sessionStorage.clear(); // Clear temp storage
      toast.success('Verified!');
      router.push('/');
    }

    setVerifying(false);
  };

  const handleBack = () => {
    if (step === 'enter_code') {
      setStep('choose_method');
      setCode('');
    } else if (step === 'choose_method') {
      setStep('credentials');
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col">
      {step === 'credentials' && (
        // STANDARD LOGIN VIEW
        <>
          {/* Login Method Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('username')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'username'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-muted-foreground hover:text-gray-900'
              }`}
            >
              Username
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-muted-foreground hover:text-gray-900'
              }`}
            >
              Email
            </button>
          </div>

          {loginMethod === 'username' ? (
            // USERNAME LOGIN FORM
            <Form {...usernameForm}>
              <form
                onSubmit={usernameForm.handleSubmit(onSubmitUsername)}
                className="flex flex-col"
              >
                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-sm text-gray-800">User ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder=""
                          {...field}
                          className="h-11 px-4 rounded-[10px] border-gray-300 bg-white focus:border-[#e02424] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          disabled={isSubmittingUsername}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={usernameForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm text-gray-800">Password</FormLabel>
                        <Link
                          href="/reset-password"
                          className="text-xs text-gray-700 hover:text-black hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder=""
                          {...field}
                          className="h-11 px-4 rounded-[10px] border-gray-300 bg-white focus:border-[#e02424] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          disabled={isSubmittingUsername}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isSubmittingUsername}
                  type="submit"
                  className="w-full h-12 mt-8 rounded-full bg-[#e02424] hover:bg-[#c81e1e] text-white font-semibold text-base transition-transform hover:-translate-y-0.5"
                >
                  {isSubmittingUsername ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log in'}
                </Button>
              </form>
            </Form>
          ) : (
            // EMAIL LOGIN FORM
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="flex flex-col">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-sm text-gray-800">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder=""
                          {...field}
                          className="h-11 px-4 rounded-[10px] border-gray-300 bg-white focus:border-[#e02424] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          disabled={isSubmittingEmail}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm text-gray-800">Password</FormLabel>
                        <Link
                          href="/reset-password"
                          className="text-xs text-gray-700 hover:text-black hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder=""
                          {...field}
                          className="h-11 px-4 rounded-[10px] border-gray-300 bg-white focus:border-[#e02424] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          disabled={isSubmittingEmail}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isSubmittingEmail}
                  type="submit"
                  className="w-full h-12 mt-8 rounded-full bg-[#e02424] hover:bg-[#c81e1e] text-white font-semibold text-base transition-transform hover:-translate-y-0.5"
                >
                  {isSubmittingEmail ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log in'}
                </Button>
              </form>
            </Form>
          )}
        </>
      )}

      {step === 'choose_method' && (
        // METHOD SELECTION VIEW
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-3 bg-slate-100 rounded-full mb-2">
            <ShieldCheck className="h-6 w-6 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-500">Choose how you want to verify your identity.</p>

          <div className="w-full space-y-3">
            <Button
              variant="outline"
              className="w-full h-16 flex items-center justify-start gap-4 px-6 border-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => handleChooseMethod('totp')}
            >
              <div className="p-2 bg-blue-100 rounded-full">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Authenticator App</p>
                <p className="text-xs text-gray-500">Use Google Authenticator or similar</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-16 flex items-center justify-start gap-4 px-6 border-2 hover:border-indigo-500 hover:bg-indigo-50"
              onClick={() => handleChooseMethod('email')}
            >
              <div className="p-2 bg-indigo-100 rounded-full">
                <Mail className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Email Code</p>
                <p className="text-xs text-gray-500">Get a code sent to your email</p>
              </div>
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to login
          </Button>
        </div>
      )}

      {step === 'enter_code' && (
        // CODE INPUT VIEW
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-blue-50 rounded-full mb-4">
            {method === 'email' ? (
              <Mail className="h-6 w-6 text-blue-600" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verification Required</h3>

          {method === 'email' ? (
            <p className="text-sm text-gray-500 mb-6">
              We sent a code to <span className="font-medium text-gray-700">{email}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              Enter the code from your authenticator app.
            </p>
          )}

          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-12 text-center text-2xl tracking-[0.5em] font-bold rounded-lg border-gray-300 focus:border-blue-500"
            maxLength={6}
          />

          <Button
            onClick={handleVerify2FA}
            disabled={verifying || code.length < 6}
            className="w-full h-12 mt-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleBack}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            ← Choose another method
          </Button>
        </div>
      )}
    </div>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const login = async (provider: 'google') => {
    await authClient.signIn.social({ provider, callbackURL: '/' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-10 bg-[#f3f3f3] border-0 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {/* Header Section */}
        <DialogHeader className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <Image
              src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
              alt="ARK Logo"
              fill
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome Arkadian!
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Enter your credentials to access your dashboard.
          </DialogDescription>
        </DialogHeader>

        {/* Form Section */}
        <div className="mb-6">
          <SignInForm />
        </div>

        {/* Divider
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#f3f3f3] px-2 text-gray-500">Or continue with</span>
          </div>
        </div> */}

        {/* Social Logins */}
        {/* <div className="flex flex-col gap-3">
          <Button
            onClick={() => login('google')}
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-800 font-medium"
          >
            <FcGoogle size={22} />
            <span>Sign in with Google</span>
          </Button>
        </div> */}

        <p className="text-xs text-center text-gray-500 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-800">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-gray-800">
            Privacy Policy
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}

function SignInCard() {
  const login = async (provider: 'google') => {
    await authClient.signIn.social({ provider, callbackURL: '/' });
  };

  return (
    <div className="w-full max-w-[450px]">
      <Card className="border-0 bg-[#f3f3f3] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        <CardContent className="p-10">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image
                src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
                alt="ARK Logo"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome Arkadian!</h2>
            <p className="text-sm text-gray-600">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <div className="mb-6">
            <SignInForm />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f3f3f3] px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => login('google')}
              variant="outline"
              className="flex items-center justify-center gap-2 h-12 w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-800 font-medium"
            >
              <FcGoogle size={22} />
              <span>Sign in with Google</span>
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-6">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-800">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-800">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// 2. NAVIGATION BAR
// ==========================================

function NavBar() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className=" top-0 left-0 w-full z-1000">
        <div className="max-w-full mx-auto px-10 py-3.5 flex items-center justify-between bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="relative h-[50px] w-[50px]">
              <Image
                src="https://5geycduwue.ufs.sh/f/KIddkrDeaHXJ6pCA7FljdVZrCkXFEDWYa8bpU9fB647TP5LI"
                alt="ARK Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="text-[17px] font-semibold text-gray-900">
              ARK Technological Institute Education System Inc.
            </div>
          </div>

          <div className="flex items-center gap-9">
            <a href="#" className="text-[15px] text-gray-900 font-medium relative group">
              <strong>Helpdesk</strong>
              <span className="absolute bottom-[-5px] left-0 w-0 h-0.5 bg-[#e02424] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="text-[15px] text-gray-900 font-medium relative group">
              <strong>FAQ</strong>
              <span className="absolute bottom-[-5px] left-0 w-0 h-0.5 bg-[#e02424] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <button
              className="bg-[#e02424] text-white border-none py-2 px-6 rounded-full text-[15px] font-semibold cursor-pointer transition-all duration-300 hover:bg-[#c81e1e] hover:-translate-y-0.5"
              onClick={() => setShowLogin(true)}
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      {/* Use the Shadcn Modal Component */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

// ==========================================
// 3. HERO BLOCK (SLIDER)
// ==========================================

function HeroBlock() {
  const slides = [
    {
      image: 'https://5geycduwue.ufs.sh/f/KIddkrDeaHXJRGrL0idydZczXHGSN36MuIQ87AqBaFhfbjiD',
      title: 'WELCOME TO A-LMS',
      text: 'This is your central hub for everything related to class announcements, course materials, and assignments. Please check this page regularly to stay informed about deadlines and new resources.',
    },
    {
      image: 'https://5geycduwue.ufs.sh/f/KIddkrDeaHXJkH5ZTqf10XqRDFfZr7PCu8GpVg5b9LBwstzQ',
      title: 'Admission for SY 2026–2027 is now open!!',
      text: 'Apply now and secure your future with ARK Technological Institute. Limited slots available.',
    },
  ];

  const [active, setActive] = useState(0);

  const nextSlide = () => setActive((n) => (n + 1) % slides.length);
  const prevSlide = () => setActive((n) => (n - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setActive(index);

  return (
    // .hero-slider: Full width, fixed height, margin for navbar
    <section className="w-full h-screen relative overflow-hidden">
      {/* .hero-slide: Background image */}
      <div
        className="w-full h-full bg-cover bg-center bg-no-repeat relative transition-all duration-500"
        style={{ backgroundImage: `url(${slides[active].image})` }}
      >
        {/* .hero-dark: Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(149,2,5,0.5)] to-transparent flex items-center pl-[80px]">
          {/* .hero-content: Text on the left */}
          <div className="max-w-[700px] text-white">
            <h1 className="text-5xl tracking-[4px] mb-5 font-bold drop-shadow-lg">
              {slides[active].title}
            </h1>
            <p className="text-lg leading-relaxed drop-shadow-md">{slides[active].text}</p>
          </div>
        </div>

        {/* Arrows */}
        <button
          className="absolute top-1/2 -translate-y-1/2 bg-transparent border-none text-4xl text-white cursor-pointer transition-opacity hover:opacity-70 left-[25px]"
          onClick={prevSlide}
        >
          ‹
        </button>
        <button
          className="absolute top-1/2 -translate-y-1/2 bg-transparent border-none text-4xl text-white cursor-pointer transition-opacity hover:opacity-70 right-[25px]"
          onClick={nextSlide}
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-[25px] left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`w-[35px] h-1.5 rounded-full cursor-pointer transition-all duration-300 ${active === index ? 'bg-white' : 'bg-white/40'}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. FOOTER
// ==========================================

function FooterBar() {
  return (
    <footer className="bg-[#0b0b0b] text-white pt-[70px]">
      <div className="max-w-[1300px] mx-auto px-10 pb-[60px] grid grid-cols-3 gap-[60px]">
        <div className="flex flex-col gap-3.5 col-span-1">
          <h3 className="text-lg mb-2">ARK Technological Institute Education System Inc.</h3>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2">
            Empowering students and teachers through innovative technology-driven education using
            A-LMS, a Smart Teacher-Centered Learning Management System with AI Instructional
            Support.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <h4 className="text-sm tracking-[2px] text-[#bbb] mb-4">QUICK LINKS</h4>
          <a
            href="#"
            className="no-underline text-[#ddd] text-sm flex gap-2 items-center hover:text-white transition"
          >
            <HelpCircle size={16} /> Helpdesk
          </a>
          <a
            href="#"
            className="no-underline text-[#ddd] text-sm flex gap-2 items-center hover:text-white transition"
          >
            <MessageCircle size={16} /> FAQ
          </a>
        </div>

        <div className="flex flex-col gap-3.5">
          <h4 className="text-sm tracking-[2px] text-[#bbb] mb-4">CONTACT US</h4>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2 items-start">
            <MapPin size={16} className="mt-1 shrink-0" />
            <span>
              J-Seven Building, Magallanes Cor Granja St. Brgy 7, Lucena, Philippines, 4301
            </span>
          </p>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2 items-center">
            <Phone size={16} /> 0907-082-9390
          </p>
          <p className="text-sm text-[#ccc] leading-relaxed flex gap-2 items-center">
            <Mail size={16} /> ark.lucena@gmail.com
          </p>
        </div>
      </div>

      <div className="border-t border-[#222] text-center py-5 text-[13px] text-[#777]">
        © 2015 ARK Technological Institute Education System Inc. All rights reserved.
      </div>
    </footer>
  );
}

// ==========================================
// 5. MAIN PAGE EXPORT
// ==========================================

export default function SignInPage() {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <NavBar />

      {/* Hero Block contains the background slider AND the SignInCard (for desktop) */}
      <HeroBlock />

      {/* 
         MOBILE FALLBACK:
         On mobile, the card inside HeroBlock is hidden (hidden lg:block).
         We show it here for mobile users.
      */}
      {/* <div className="lg:hidden flex justify-center py-10 bg-slate-100">
        <SignInCard />
      </div> */}

      <FooterBar />
    </div>
  );
}
