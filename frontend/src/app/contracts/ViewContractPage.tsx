import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ArrowLeft, Shield, LogOut, Send, MessageSquare, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { contractService } from "../services/contractService";
import { authService } from "../services/authService";

interface Comment {
  id: string;
  author: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "analysed":
    case "analyzed":
      return "bg-blue-600 text-blue-100 hover:bg-blue-600";
    case "accepted":
    case "approved":
    case "completed":
      return "bg-green-600 text-green-100 hover:bg-green-600";
    case "rejected":
    case "requires revision":
      return "bg-red-600 text-red-100 hover:bg-red-600";
    default:
      return "bg-slate-600 text-slate-100 hover:bg-slate-600";
  }
};

export function ViewContractPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('from') || '/admin-dashboard';

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Comments state
  const [externalComments, setExternalComments] = useState<Comment[]>([]);
  const [internalComments, setInternalComments] = useState<Comment[]>([]);

  const [newExternalComment, setNewExternalComment] = useState("");
  const [newInternalComment, setNewInternalComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ type: 'external' | 'internal', commentId: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [cData, uData] = await Promise.all([
          contractService.getContract(id),
          authService.getCurrentUser()
        ]);
        setContract(cData);
        setCurrentUser(uData);

        const commentsData = await contractService.getComments(id);
        if (commentsData) {
          // Transform flat list to nested tree
          const commentMap: Record<string, any> = {};
          const external: any[] = [];
          const internal: any[] = [];

          commentsData.forEach(c => {
            const commentObj = {
              id: c.id,
              author: c.user_name || "User",
              user_id: c.user_id,
              role: c.user_id === (uData as any)._id ? "You" : "User",
              avatar: (c.user_name || "U")[0],
              content: c.comment_text,
              timestamp: new Date(c.created_at).toLocaleString(),
              replies: [],
              comment_type: c.comment_type
            };
            commentMap[c.id] = commentObj;
          });

          commentsData.forEach(c => {
            if (c.reply_comment_id && commentMap[c.reply_comment_id]) {
              commentMap[c.reply_comment_id].replies.push(commentMap[c.id]);
            } else {
              if (c.comment_type === 'external') external.push(commentMap[c.id]);
              else if (c.comment_type === 'internal') internal.push(commentMap[c.id]);
            }
          });

          setExternalComments(external);
          setInternalComments(internal);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddExternalComment = async () => {
    if (!id || !newExternalComment.trim()) return;
    try {
      await contractService.addComment(id, newExternalComment, 'external');
      setNewExternalComment("");
      // Refresh comments
      const freshComments = await contractService.getComments(id);
      refreshCommentView(freshComments);
    } catch (e) {
      console.error("Failed to post comment:", e);
    }
  };

  const handleAddInternalComment = async () => {
    if (!id || !newInternalComment.trim()) return;
    try {
      await contractService.addComment(id, newInternalComment, 'internal');
      setNewInternalComment("");
      // Refresh comments
      const freshComments = await contractService.getComments(id);
      refreshCommentView(freshComments);
    } catch (e) {
      console.error("Failed to post internal comment:", e);
    }
  };



  const refreshCommentView = (commentsData: any[]) => {
    const commentMap: Record<string, any> = {};
    const external: any[] = [];
    const internal: any[] = [];

    commentsData.forEach(c => {
      const commentObj = {
        id: c.id,
        author: c.user_name || "User",
        user_id: c.user_id,
        role: "User",
        avatar: (c.user_name || "U")[0],
        content: c.comment_text,
        timestamp: new Date(c.created_at).toLocaleString(),
        replies: []
      };
      commentMap[c.id] = commentObj;
    });

    commentsData.forEach(c => {
      if (c.reply_comment_id && commentMap[c.reply_comment_id]) {
        commentMap[c.reply_comment_id].replies.push(commentMap[c.id]);
      } else {
        if (c.comment_type === 'external') external.push(commentMap[c.id]);
        else if (c.comment_type === 'internal') internal.push(commentMap[c.id]);
      }
    });

    setExternalComments(external);
    setInternalComments(internal);
  };

  const handleAddReply = async () => {
    if (!id || !replyText.trim() || !replyingTo) return;
    try {
      await contractService.addComment(id, replyText, replyingTo.type, replyingTo.commentId);
      setReplyText("");
      setReplyingTo(null);
      // Refresh
      const freshComments = await contractService.getComments(id);
      refreshCommentView(freshComments);
    } catch (e) {
      console.error("Failed to post reply:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1729]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1729]">
        <div className="text-center">
          <h2 className="text-2xl text-white">Contract not found</h2>
          <Button onClick={() => navigate(fromPath)} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1729]">
      <nav className="border-b border-slate-700 bg-[#1a2332]">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(fromPath)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl text-white">Contract AI</span>
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl text-slate-200">View Contract</h1>
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9 bg-slate-700">
                <AvatarFallback className="bg-slate-700 text-slate-200">
                  {currentUser?.full_name?.substring(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-200"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1800px] px-6 py-8">
        <Button
          onClick={() => navigate(fromPath)}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="mb-2 text-2xl text-white">{contract.filename || contract.name}</h2>
                <div className="text-sm text-slate-400">Contract Document</div>
              </div>

              <div className="h-[800px] overflow-y-auto rounded-lg border border-slate-700 bg-[#0f1729] p-8">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                  {contract.contract_text || contract.content || "Contract content not available."}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-700 bg-[#1a2332]">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg text-white">Contract Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Contract ID</div>
                    <div className="mt-1 text-sm text-slate-200">{contract._id || contract.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Status</div>
                    <div className="mt-1">
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Contract Type</div>
                    <div className="mt-1 text-sm text-slate-200">{contract.contract_type || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Upload Date</div>
                    <div className="mt-1 text-sm text-slate-200">
                      24.2.2024
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-[#1a2332]">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg text-white">Assigned Team</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Client</div>
                    <div className="mt-1 text-sm text-slate-200">
                      {contract.client_name || "N/A"}
                      <span className="ml-2 text-[10px] text-slate-500">({contract.client_id || "No ID"})</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Paralegal</div>
                    <div className="mt-1 text-sm text-slate-200">
                      {contract.paralegal_name || "N/A"}
                      <span className="ml-2 text-[10px] text-slate-500">({contract.paralegal_id || "No ID"})</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Lawyer</div>
                    <div className="mt-1 text-sm text-slate-200">
                      {contract.lawyer_name || "N/A"}
                      <span className="ml-2 text-[10px] text-slate-500">({contract.lawyer_id || "No ID"})</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Uploader ID</div>
                    <div className="mt-1 text-[11px] text-slate-500">{contract.uploader_id || "N/A"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-slate-700 bg-[#1a2332]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg text-white">External Comments</h3>
                <span className="text-xs text-slate-500">(Visible to clients and team members)</span>
              </div>

              <div className="mb-4 space-y-4">
                {externalComments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-slate-700 bg-[#0f1729] p-4">
                    <div className="mb-2 flex items-start gap-3">
                      <Avatar className="h-8 w-8 bg-slate-700">
                        <AvatarFallback className="text-xs text-slate-200">{comment.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-slate-200">{comment.author}</span>
                          <span className="text-xs text-slate-500">{comment.role}</span>
                          <span className="text-xs text-slate-600">•</span>
                          <span className="text-xs text-slate-500">{comment.timestamp}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">{comment.content}</p>
                        <Button
                          onClick={() => setReplyingTo({ type: 'external', commentId: comment.id })}
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>

                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="ml-11 mt-3 space-y-3 border-l-2 border-slate-700 pl-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-7 w-7 bg-slate-700">
                            <AvatarFallback className="text-xs text-slate-200">{reply.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm text-slate-200">{reply.author}</span>
                              <span className="text-xs text-slate-500">{reply.role}</span>
                              <span className="text-xs text-slate-600">•</span>
                              <span className="text-xs text-slate-500">{reply.timestamp}</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-300">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {replyingTo?.type === 'external' && replyingTo.commentId === comment.id && (
                      <div className="ml-11 mt-3 border-l-2 border-slate-700 pl-4">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="mb-2 border-slate-600 bg-[#1a2332] text-slate-200"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddReply} size="sm" className="bg-blue-700 text-blue-100 hover:bg-blue-600">
                            <Send className="mr-2 h-3 w-3" />
                            Reply
                          </Button>
                          <Button onClick={() => { setReplyingTo(null); setReplyText(""); }} size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Textarea
                  value={newExternalComment}
                  onChange={(e) => setNewExternalComment(e.target.value)}
                  placeholder="Add a comment visible to clients and team members..."
                  className="border-slate-600 bg-[#0f1729] text-slate-200"
                  rows={3}
                />
                <Button onClick={handleAddExternalComment} className="mt-2 bg-blue-700 text-blue-100 hover:bg-blue-600">
                  <Send className="mr-2 h-4 w-4" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentUser?.role !== 'client' && (
            <Card className="border-slate-700 bg-[#1a2332]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg text-white">Internal Comments</h3>
                  <span className="text-xs text-slate-500">(Visible to paralegals, lawyers, and admins only)</span>
                </div>

                <div className="mb-4 space-y-4">
                  {internalComments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-amber-900/30 bg-[#0f1729] p-4">
                      <div className="mb-2 flex items-start gap-3">
                        <Avatar className="h-8 w-8 bg-slate-700">
                          <AvatarFallback className="text-xs text-slate-200">{comment.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-slate-200">{comment.author}</span>
                            <span className="text-xs text-slate-500">{comment.role}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{comment.timestamp}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{comment.content}</p>
                          <Button
                            onClick={() => setReplyingTo({ type: 'internal', commentId: comment.id })}
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 text-xs text-slate-400 hover:text-slate-200"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>

                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="ml-11 mt-3 space-y-3 border-l-2 border-slate-700 pl-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-7 w-7 bg-slate-700">
                              <AvatarFallback className="text-xs text-slate-200">{reply.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm text-slate-200">{reply.author}</span>
                                <span className="text-xs text-slate-500">{reply.role}</span>
                                <span className="text-xs text-slate-600">•</span>
                                <span className="text-xs text-slate-500">{reply.timestamp}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-300">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {replyingTo?.type === 'internal' && replyingTo.commentId === comment.id && (
                        <div className="ml-11 mt-3 border-l-2 border-slate-700 pl-4">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="mb-2 border-slate-600 bg-[#1a2332] text-slate-200"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <Button onClick={handleAddReply} size="sm" className="bg-amber-700 text-amber-100 hover:bg-amber-600">
                              Reply
                            </Button>
                            <Button onClick={() => { setReplyingTo(null); setReplyText(""); }} size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Textarea
                    value={newInternalComment}
                    onChange={(e) => setNewInternalComment(e.target.value)}
                    placeholder="Add an internal comment (team only)..."
                    className="border-slate-600 bg-[#0f1729] text-slate-200"
                    rows={3}
                  />
                  <Button onClick={handleAddInternalComment} className="mt-2 border-amber-900/50 bg-amber-900/20 text-amber-200 hover:bg-amber-900/40" variant="outline">
                    <Send className="mr-2 h-4 w-4" />
                    Post Internal Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
}
