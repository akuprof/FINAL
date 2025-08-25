import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signIn, signUp } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error, data } = isSignUp 
        ? await signUp(email, password, { role: 'driver' })
        : await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else if (isSignUp && data) {
        setSuccess("Account created successfully! Please check your email to verify your account.");
        setIsSignUp(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6 px-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bus text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">PLS Travels</h1>
            <p className="text-gray-600">Fleet Management System</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-4">
              Comprehensive fleet management with role-based access control for drivers, managers, and administrators.
            </p>
            
            <div className="text-left space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-check-circle text-success mr-2"></i>
                Driver trip logging and payout tracking
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-check-circle text-success mr-2"></i>
                Vehicle and driver management
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-check-circle text-success mr-2"></i>
                Automated payout calculations
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-check-circle text-success mr-2"></i>
                Manager approval workflows
              </div>
            </div>
          </div>

          {!showLogin ? (
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setShowLogin(true);
                  setIsSignUp(false);
                }}
                className="w-full bg-primary hover:bg-primary-dark text-white"
                data-testid="login-button"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In to Continue
              </Button>
              <Button 
                onClick={() => {
                  setShowLogin(true);
                  setIsSignUp(true);
                }}
                variant="outline"
                className="w-full"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Create Account
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              {isSignUp && (
                <div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              )}
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {success && (
                <p className="text-green-500 text-sm">{success}</p>
              )}
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white"
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-sign-in-alt'} mr-2`}></i>
                )}
                {isLoading ? (isSignUp ? "Creating Account..." : "Signing In...") : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
              <div className="flex space-x-2">
                <Button 
                  type="button"
                  onClick={() => setShowLogin(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setSuccess("");
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  {isSignUp ? "Sign In Instead" : "Create Account"}
                </Button>
              </div>
            </form>
          )}

          <p className="text-xs text-gray-500 mt-4">
            Secure authentication powered by Supabase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
