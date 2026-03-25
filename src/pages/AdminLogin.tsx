import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("注册成功，请登录");
        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("登录成功");
        navigate("/admin");
      }
    } catch (err: any) {
      toast.error(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-texture flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock size={20} className="text-primary" />
          </div>
          <h1 className="text-2xl font-display tracking-wider text-foreground">
            {isSignup ? "注册管理员" : "管理员登录"}
          </h1>
          <p className="text-sm text-muted-foreground">登录后可管理书籍和章节</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "处理中..." : isSignup ? "注册" : "登录"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? "已有账号？" : "没有账号？"}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-primary hover:underline ml-1"
          >
            {isSignup ? "去登录" : "注册一个"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
