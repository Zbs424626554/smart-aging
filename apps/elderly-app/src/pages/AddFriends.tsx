import { useEffect, useState } from 'react';
import { List, Empty, Toast, Dialog } from 'antd-mobile';
import { UserService } from '../services/user.service';
import { MessageService } from '../services/message.service';
import { useNavigate } from 'react-router-dom';
import NavBal from '../components/NavBal';

type FriendRequest = {
    _id: string;
    fromUsername: string;
    fromRealname?: string;
    toUsername: string;
    toRealname?: string;
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
};

export default function AddFriends() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<FriendRequest[]>([]);

    const currentUser = (() => {
        try {
            const raw = localStorage.getItem('userInfo');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const load = async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const resp = await UserService.getReceivedFriendRequests({ toUserId: currentUser.id || currentUser._id, toUsername: currentUser.username });
            const arr = (resp as any)?.data?.list || [];
            setList(arr);
        } catch (e: any) {
            Toast.show({ content: e?.message || '加载失败' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleShowApplicant = async (req: FriendRequest) => {
        try {
            const resp = await UserService.searchUsers(req.fromUsername, { limit: 1 });
            const user = (resp as any)?.list?.find((u: any) => u.username === req.fromUsername) || (resp as any)?.list?.[0] || null;
            const username = user?.username || req.fromUsername || '-';
            const realname = user?.realname || req.fromRealname || username;
            const phone = user?.phone || '-';
            const maskPhone = (input?: string) => {
                try {
                    const s = String(input || '').trim();
                    if (!s) return '-';
                    if (/^\d{11}$/.test(s)) return s.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
                    return s.replace(/(\d{3})(\d+)(\d{4})/, (_m, a, b, c) => `${a}${'*'.repeat(Math.max(4, String(b).length))}${c}`);
                } catch { return String(input || '-'); }
            };
            const phoneMasked = maskPhone(phone);
            let dlg: any;
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';
            dlg = Dialog.show({
                title: <div style={{ fontSize: 26, fontWeight: 700, paddingBottom: 12, marginBottom: 12, borderBottom: '2px solid #eaeaea', display: 'block' }}>好友申请</div>,
                content: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 18 }}>
                        <div><span style={{ color: '#000', fontSize: 22 }}>昵　称：</span><span style={{ color: '#000', fontSize: 22 }}>{realname}</span></div>
                        <div><span style={{ color: '#000', fontSize: 22 }}>用户名：</span><span style={{ color: '#000', fontSize: 22 }}>{username}</span></div>
                        <div><span style={{ color: '#000', fontSize: 22 }}>手机号：</span><span style={{ color: '#000', fontSize: 22 }}>{phoneMasked}</span></div>
                        {!isPending && (
                            <div style={{ marginTop: 4, color: isApproved ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
                                {isApproved ? '已经通过好友申请' : '已经拒绝好友申请'}
                            </div>
                        )}
                        {isPending && (
                            <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'center' }}>
                                <button
                                    onClick={async () => { try { await UserService.updateFriendRequestStatus(req._id, 'approved'); Toast.show({ content: '已通过好友申请' }); dlg?.close?.(); load(); } catch (e: any) { Toast.show({ content: e?.message || '操作失败' }); } }}
                                    style={{ flex: 1, maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid #52c41a', background: '#52c41a', color: '#fff', fontSize: 16, cursor: 'pointer' }}
                                >
                                    通过
                                </button>
                                <button
                                    onClick={async () => { try { await UserService.updateFriendRequestStatus(req._id, 'rejected'); Toast.show({ content: '已拒绝好友申请' }); dlg?.close?.(); load(); } catch (e: any) { Toast.show({ content: e?.message || '操作失败' }); } }}
                                    style={{ flex: 1, maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid #ff4d4f', background: '#ff4d4f', color: '#fff', fontSize: 16, cursor: 'pointer' }}
                                >
                                    拒绝
                                </button>
                                <button
                                    onClick={() => { dlg?.close?.(); }}
                                    style={{ flex: 1, maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid #91caff', background: '#fff', color: '#1677ff', fontSize: 16, cursor: 'pointer' }}
                                >
                                    知道了
                                </button>
                            </div>
                        )}
                        {isRejected && (
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                                <button onClick={() => { dlg?.close?.(); }} style={{ width: '95%', padding: '10px 12px', borderRadius: 8, border: '1px solid #91caff', background: '#fff', color: '#1677ff', fontSize: 16, cursor: 'pointer' }}>知道了</button>
                            </div>
                        )}
                        {isApproved && (
                            <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'center' }}>
                                <button
                                    onClick={async () => {
                                        try {
                                            const current = currentUser;
                                            const participants = [
                                                { username: current.username, realname: current.realname || current.username, role: current.role || 'elderly' },
                                                { username, realname: realname || username, role: 'elderly' },
                                            ];
                                            const res = await MessageService.createConversation({ participants, initialMessage: { content: '你好', type: 'text' } });
                                            dlg?.close?.();
                                            if ((res as any)?.conversationId) {
                                                navigate(`/chat/${(res as any).conversationId}`);
                                            }
                                        } catch (e: any) {
                                            Toast.show({ content: e?.message || '无法发起聊天' });
                                        }
                                    }}
                                    style={{ flex: 1, maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid #1677ff', background: '#1677ff', color: '#fff', fontSize: 16, cursor: 'pointer' }}
                                >
                                    发消息
                                </button>
                                <button onClick={() => { dlg?.close?.(); }} style={{ flex: 1, maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid #91caff', background: '#fff', color: '#1677ff', fontSize: 16, cursor: 'pointer' }}>知道了</button>
                            </div>
                        )}
                    </div>
                ),
            });
        } catch (e: any) {
            Toast.show({ content: e?.message || '加载申请人信息失败' });
        }
    };

    return (
        <div style={{ height: '100%', background: '#fff' }}>
            <NavBal title="添加好友" />
            <div style={{ padding: 12 }} aria-busy={loading}>
                {list.length === 0 ? (
                    <Empty description="暂无好友申请" style={{ padding: '60px 0' }} />
                ) : (
                    <List>
                        {list.map((req) => {
                            const msg = req.status === 'approved' ? '已经通过好友申请' : (req.status === 'rejected' ? '已经拒绝好友申请' : (req.message || ''));
                            return (
                                <List.Item key={req._id}
                                    onClick={() => handleShowApplicant(req)}
                                    description={<span style={{ color: '#999' }}>{new Date(req.createdAt).toLocaleString()}</span>}
                                    extra={<span style={{ color: req.status === 'pending' ? '#1677ff' : req.status === 'approved' ? '#52c41a' : '#ff4d4f' }}>{req.status === 'pending' ? '待处理' : req.status === 'approved' ? '已通过' : '已拒绝'}</span>}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: 16, fontWeight: 600 }}>{req.fromRealname || req.fromUsername}</span>
                                        {msg && <span style={{ marginTop: 4, color: '#666' }}>{msg}</span>}
                                    </div>
                                </List.Item>
                            );
                        })}
                    </List>
                )}
            </div>
        </div>
    );
}
