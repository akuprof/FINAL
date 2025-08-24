import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
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

          <Button 
            onClick={() => {
              // You can implement a sign-in modal here or redirect to a sign-in page
              console.log("Sign in with Supabase");
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
            data-testid="login-button"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Sign In to Continue
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            Secure authentication powered by Replit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
