import React, { useEffect, useMemo, useState } from "react";
import { Spin, Empty } from "antd";
import { List, Dialog, Button, Input, Space, Toast, Popover } from "antd-mobile";
import { DeleteOutline } from "antd-mobile-icons";
import {
  ElderHealthService,
  type ElderHealthArchiveDto,
} from "../services/elderhealth.service";
import { UserService, type User } from "../services/user.service";
import NavBal from "../components/NavBal";

const Health: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [archive, setArchive] = useState<ElderHealthArchiveDto | null>(null);
  // 预留转换工具（当前未使用）
  const safe = (v?: string | number): string =>
    v === undefined || v === null || String(v).trim() === ""
      ? "未设置"
      : String(v);

  // 手机号中间四位脱敏显示
  const maskPhone = (rawPhone?: string | number): string => {
    if (rawPhone === undefined || rawPhone === null) return "未设置";
    const digitsOnly = String(rawPhone).replace(/\D/g, "");
    if (digitsOnly.length === 11) {
      return digitsOnly.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
    }
    if (digitsOnly.length >= 7) {
      const prefix = digitsOnly.slice(0, 3);
      const suffix = digitsOnly.slice(-4);
      return `${prefix}****${suffix}`;
    }
    return digitsOnly || "未设置";
  };

  const content = useMemo(() => {
    return (
      <List style={{ fontSize: 18, lineHeight: 1.7 }}>
        <List.Item
          style={{ fontSize: 18 }}
          extra={<span style={{ fontSize: 18 }}>{safe(archive?.name)}</span>}
          arrow={false}
          onClick={() => {
            let nameInput = archive?.name || "";
            let handler: any;
            handler = Dialog.show({
              title: "设置姓名",
              content: (
                <div style={{ paddingTop: 12 }}>
                  <Input
                    style={{ fontSize: 18, height: 44 }}
                    placeholder="请输入姓名"
                    defaultValue={nameInput}
                    onChange={(v) => (nameInput = v)}
                  />
                </div>
              ),
              closeOnMaskClick: false,
              actions: [
                {
                  key: "cancel",
                  text: "取消",
                  onClick: () => {
                    Toast.show({ content: "已取消" });
                    handler.close();
                  },
                },
                {
                  key: "ok",
                  text: "保存",
                  bold: true,
                  onClick: async () => {
                    const nm = (nameInput || "").trim();
                    if (!nm) {
                      Toast.show({ content: "请输入姓名" });
                      return;
                    }
                    try {
                      const updated = await ElderHealthService.updateName(nm);
                      setArchive(updated || null);
                      Toast.show({ content: "已保存" });
                      handler.close();
                    } catch (err: any) {
                      Toast.show({ content: err?.message || "保存失败" });
                    }
                  },
                },
              ],
            });
          }}
        >
          姓名
        </List.Item>
        <List.Item
          style={{ fontSize: 18 }}
          extra={
            <span style={{ fontSize: 18 }}>
              {(() => {
                const g = (archive as any)?.gender as string | undefined;
                if (!g) return "保密";
                if (g === "male") return "男";
                if (g === "female") return "女";
                return "保密";
              })()}
            </span>
          }
          arrow={false}
          onClick={() => {
            let selected = (archive as any)?.gender || "secret";
            let latest = selected;
            const GenderForm: React.FC = () => {
              const [sel, setSel] = useState<string>(latest);
              useEffect(() => {
                latest = sel;
              }, [sel]);
              const opts = [
                { key: "male", label: "男" },
                { key: "female", label: "女" },
                { key: "secret", label: "保密" },
              ];
              return (
                <div style={{ paddingTop: 12 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    {opts.map((opt) => (
                      <Button
                        key={opt.key}
                        color="primary"
                        fill={sel === opt.key ? "solid" : "outline"}
                        onClick={() => setSel(opt.key)}
                        style={{ height: 38 }}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            };
            let handler: any;
            handler = Dialog.show({
              title: "设置性别",
              content: <GenderForm />,
              closeOnMaskClick: false,
              actions: [
                {
                  key: "cancel",
                  text: "取消",
                  onClick: () => {
                    Toast.show({ content: "已取消" });
                    handler.close();
                  },
                },
                {
                  key: "ok",
                  text: "保存",
                  bold: true,
                  onClick: async () => {
                    try {
                      const updated = await ElderHealthService.updateGender(latest);
                      setArchive(updated || null);
                      Toast.show({ content: "已保存" });
                      handler.close();
                    } catch (err: any) {
                      Toast.show({ content: err?.message || "保存失败" });
                    }
                  },
                },
              ],
            });
          }}
        >
          性别
        </List.Item>
        <List.Item
          style={{ fontSize: 18 }}
          extra={
            <span style={{ fontSize: 18 }}>
              {safe(archive?.age as unknown as string)}
            </span>
          }
          arrow={false}
          onClick={() => {
            let ageInput = archive?.age?.toString() || "";
            let handler: any;
            handler = Dialog.show({
              title: "设置年龄",
              content: (
                <div style={{ paddingTop: 12 }}>
                  <Input
                    style={{ fontSize: 18, height: 44 }}
                    type="number"
                    placeholder="请输入年龄"
                    defaultValue={ageInput}
                    onChange={(v) => (ageInput = v)}
                  />
                </div>
              ),
              closeOnMaskClick: false,
              actions: [
                {
                  key: "cancel",
                  text: "取消",
                  onClick: () => {
                    Toast.show({ content: "已取消" });
                    handler.close();
                  },
                },
                {
                  key: "ok",
                  text: "保存",
                  bold: true,
                  onClick: async () => {
                    const age = parseInt(ageInput);
                    if (isNaN(age) || age < 0 || age > 150) {
                      Toast.show({ content: "请输入有效年龄(0-150)" });
                      return;
                    }
                    try {
                      const updated = await ElderHealthService.updateAge(age);
                      setArchive(updated || null);
                      Toast.show({ content: "已保存" });
                      handler.close();
                    } catch (err: any) {
                      Toast.show({ content: err?.message || "保存失败" });
                    }
                  },
                },
              ],
            });
          }}
        >
          年龄
        </List.Item>
        <List.Item
          style={{ fontSize: 18 }}
          extra={
            <span style={{ fontSize: 18 }}>
              {archive?.heightCm ? `${archive.heightCm} cm` : "未设置"}
            </span>
          }
          arrow={false}
          onClick={() => {
            let heightInput = archive?.heightCm?.toString() || "";
            let handler: any;
            handler = Dialog.show({
              title: "设置身高",
              content: (
                <div style={{ paddingTop: 12 }}>
                  <Input
                    style={{ fontSize: 18, height: 44 }}
                    type="number"
                    placeholder="请输入身高(cm)"
                    defaultValue={heightInput}
                    onChange={(v) => (heightInput = v)}
                  />
                </div>
              ),
              closeOnMaskClick: false,
              actions: [
                { key: "cancel", text: "取消", onClick: () => handler.close() },
                {
                  key: "ok",
                  text: "保存",
                  bold: true,
                  onClick: async () => {
                    const val = Number(heightInput);
                    if (!Number.isFinite(val) || val <= 0 || val > 300) {
                      Toast.show({ content: "请输入有效身高(0-300cm)" });
                      return;
                    }
                    try {
                      const updated = await ElderHealthService.updateHeight(val);
                      setArchive(updated || null);
                      Toast.show({ content: "已保存" });
                      handler.close();
                    } catch (err: any) {
                      Toast.show({ content: err?.message || "保存失败" });
                    }
                  },
                },
              ],
            });
          }}
        >
          身高
        </List.Item>
        <List.Item
          style={{ fontSize: 18 }}
          extra={
            <span style={{ fontSize: 18 }}>
              {archive?.weightKg ? `${archive.weightKg} kg` : "未设置"}
            </span>
          }
          arrow={false}
          onClick={() => {
            let weightInput = archive?.weightKg?.toString() || "";
            let handler: any;
            handler = Dialog.show({
              title: "设置体重",
              content: (
                <div style={{ paddingTop: 12 }}>
                  <Input
                    style={{ fontSize: 18, height: 44 }}
                    type="number"
                    placeholder="请输入体重(kg)"
                    defaultValue={weightInput}
                    onChange={(v) => (weightInput = v)}
                  />
                </div>
              ),
              closeOnMaskClick: false,
              actions: [
                { key: "cancel", text: "取消", onClick: () => handler.close() },
                {
                  key: "ok",
                  text: "保存",
                  bold: true,
                  onClick: async () => {
                    const val = Number(weightInput);
                    if (!Number.isFinite(val) || val <= 0 || val > 500) {
                      Toast.show({ content: "请输入有效体重(0-500kg)" });
                      return;
                    }
                    try {
                      const updated = await ElderHealthService.updateWeight(val);
                      setArchive(updated || null);
                      Toast.show({ content: "已保存" });
                      handler.close();
                    } catch (err: any) {
                      Toast.show({ content: err?.message || "保存失败" });
                    }
                  },
                },
              ],
            });
          }}
        >
          体重
        </List.Item>
        <List.Item
          style={{ fontSize: 18 }}
          extra={
            <span style={{ fontSize: 18 }}>{maskPhone(archive?.phone)}</span>
          }
        >
          电话
        </List.Item>
        <List.Item
          arrow={false}
          style={{ fontSize: 18 }}
          extra={<span style={{ fontSize: 18 }}>{safe(archive?.address)}</span>}
          onClick={() => {
            let addressInput = archive?.address || "";
            let handler: any;
            handler = Dialog.show({
              title: "设置地址",
              content: (
                <div style={{ paddingTop: 12 }}>
                  <Input
                    style={{ fontSize: 18, height: 44 }}
                    placeholder="请输入地址"
                    defaultValue={addressInput}
                    onChange={(v) => (addressInput = v)}
                  />
                </div>
              ),
              closeOnMaskClick: false,
              actions: [
                {
                  key: "cancel",
                  text: "取消",
                  onClick: () => {
                    Toast.show({ content: "已取消" });
                    handler.close();
                  },
                },
                {
                  key: "ok",
                  text: "保存",
                  bold: true,
                  onClick: async () => {
                    const trimmed = (addressInput || "").trim();
                    if (!trimmed) {
                      Toast.show({ content: "请输入地址" });
                      return;
                    }
                    try {
                      const updated =
                        await ElderHealthService.updateAddress(trimmed);
                      setArchive(updated || null);
                      Toast.show({ content: "已保存" });
                      handler.close();
                    } catch (err: any) {
                      Toast.show({ content: err?.message || "保存失败" });
                    }
                  },
                },
              ],
            });
          }}
        >
          地址
        </List.Item>
        <List.Item
          style={{ fontSize: 18 }}
          extra={
            <span style={{ fontSize: 18 }}>
              {safe(
                archive?.emcontact?.realname || archive?.emcontact?.username
              )}
            </span>
          }
          arrow={false}
          onClick={() => {
            let handler: any;

            const FamilyPicker: React.FC = () => {
              const [keyword, setKeyword] = useState<string>("");
              const [loadingList, setLoadingList] = useState<boolean>(false);
              const [results, setResults] = useState<User[]>([]);

              // 初次渲染不主动拉取，避免严格模式下二次调用；数据通过下方搜索 effect 触发

              // 移除初次立即拉取，避免在 React StrictMode 下重复请求

              useEffect(() => {
                const timer = setTimeout(async () => {
                  const kw = keyword.trim();
                  if (!kw) {
                    // 关键字为空：不请求，清空结果
                    setResults([]);
                    return;
                  }
                  setLoadingList(true);
                  try {
                    const resp = await UserService.searchUsers(kw, {
                      role: "family",
                      limit: 100,
                    });
                    setResults(resp?.list || []);
                  } catch (err: any) {
                    Toast.show({ content: err?.message || "搜索失败" });
                  } finally {
                    setLoadingList(false);
                  }
                }, 1500);
                return () => clearTimeout(timer);
              }, [keyword]);

              const handlePick = async (u: User) => {
                try {
                  const updated = await ElderHealthService.saveEmergencyContact({
                    // 仅使用 username 进行匹配，避免 realname 为空或 phone 格式差异导致匹配失败
                    username: u.username,
                  });
                  setArchive(updated || null);
                  Toast.show({ content: "已设置为紧急联系人" });
                  if (handler) handler.close();
                } catch (err: any) {
                  Toast.show({ content: err?.message || "保存失败" });
                }
              };

              return (
                <div style={{ paddingTop: 12 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Input
                      style={{ fontSize: 18, height: 44 }}
                      placeholder="按用户名或手机号搜索"
                      value={keyword}
                      onChange={setKeyword}
                    />
                    <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                      {loadingList ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
                          <Spin />
                        </div>
                      ) : results.length === 0 ? (
                        <div style={{ padding: 12 }}>
                          <Empty description="暂无数据" />
                        </div>
                      ) : (
                        results.map((u) => (
                          <div
                            key={u.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 4px",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <div style={{ fontSize: 18, fontWeight: 600 }}>
                                {u.realname || u.username}
                              </div>
                              <div style={{ fontSize: 14, color: "#666" }}>
                                {u.username} · {u.phone || "无手机号"}
                              </div>
                            </div>
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => handlePick(u)}
                              style={{ height: 34, padding: "0 12px", fontSize: 14, borderRadius: 16 }}
                            >
                              选择
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </Space>
                </div>
              );
            };

            handler = Dialog.show({
              title: "选择紧急联系人",
              content: <FamilyPicker />,
              closeOnMaskClick: true,
              actions: [
                { key: "close", text: "关闭", onClick: () => handler.close() },
              ],
              style: { "--min-width": "86vw", "--max-width": "92vw" } as any,
            });
          }}
        >
          紧急联系人
        </List.Item>
        <List.Item
          arrow
          onClick={() => {
            let listHandler: any;

            const openList = () => {
              listHandler = Dialog.show({
                title: (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 700 }}>
                      疾病史
                    </span>
                    <Button
                      size="small"
                      color="primary"
                      onClick={openAdd}
                      style={{ height: 36, fontSize: 16, padding: "0 14px" }}
                    >
                      添加
                    </Button>
                  </div>
                ),
                content: (
                  <div>
                    {(() => {
                      // 在弹窗内容中动态获取最新的疾病史数据
                      const items = archive?.medicals || [];
                      return items.length === 0 ? (
                        <div style={{ padding: 12 }}>
                          <Empty description="暂无疾病史" />
                        </div>
                      ) : (
                        items.map((m, idx) => (
                          <div
                            key={idx}
                            style={{ padding: "8px 0", fontSize: 18 }}
                          >
                            {m}
                          </div>
                        ))
                      );
                    })()}
                  </div>
                ),
                closeOnMaskClick: true,
              });
            };

            const openAdd = () => {
              let inputValue = "";
              let handler: any;
              handler = Dialog.show({
                title: "添加疾病史",
                content: (
                  <div style={{ paddingTop: 12 }}>
                    <Input
                      style={{ fontSize: 18, height: 44 }}
                      placeholder="请输入疾病名称"
                      onChange={(v) => (inputValue = v)}
                    />
                  </div>
                ),
                closeOnMaskClick: false,
                actions: [
                  {
                    key: "cancel",
                    text: "取消",
                    onClick: () => {
                      inputValue = "";
                      Toast.show({ content: "已取消" });
                      handler.close();
                    },
                  },
                  {
                    key: "ok",
                    text: "保存",
                    bold: true,
                    onClick: async () => {
                      if (!inputValue || !inputValue.trim()) {
                        Toast.show({ content: "请输入内容" });
                        return;
                      }
                      try {
                        const updated = await ElderHealthService.addMedical(
                          inputValue.trim()
                        );
                        // 更新本地状态
                        setArchive(updated || null);
                        Toast.show({ content: "已保存" });
                        handler.close();

                        // 关闭当前列表对话框
                        if (listHandler) {
                          listHandler.close();
                        }
                      } catch (err: any) {
                        Toast.show({ content: err?.message || "保存失败" });
                      }
                    },
                  },
                ],
              });
            };

            openList();
          }}
        >
          疾病史
        </List.Item>
        <List.Item
          arrow
          onClick={() => {
            let listHandler: any;

            const openList = () => {
              listHandler = Dialog.show({
                title: (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 700 }}>
                      过敏史
                    </span>
                    <Button
                      size="small"
                      color="primary"
                      onClick={openAdd}
                      style={{ height: 36, fontSize: 16, padding: "0 14px" }}
                    >
                      添加
                    </Button>
                  </div>
                ),
                content: (
                  <div>
                    {(() => {
                      // 在弹窗内容中动态获取最新的过敏史数据
                      const items = archive?.allergies || [];
                      return items.length === 0 ? (
                        <div style={{ padding: 12 }}>
                          <Empty description="暂无过敏史" />
                        </div>
                      ) : (
                        items.map((a, idx) => (
                          <div
                            key={idx}
                            style={{ padding: "8px 0", fontSize: 18 }}
                          >
                            {a}
                          </div>
                        ))
                      );
                    })()}
                  </div>
                ),
                closeOnMaskClick: true,
              });
            };

            const openAdd = () => {
              let inputValue = "";
              let handler: any;
              handler = Dialog.show({
                title: "添加过敏史",
                content: (
                  <div style={{ paddingTop: 12 }}>
                    <Input
                      style={{ fontSize: 18, height: 44 }}
                      placeholder="请输入过敏源"
                      onChange={(v) => (inputValue = v)}
                    />
                  </div>
                ),
                closeOnMaskClick: false,
                actions: [
                  {
                    key: "cancel",
                    text: "取消",
                    onClick: () => {
                      inputValue = "";
                      Toast.show({ content: "已取消" });
                      handler.close();
                    },
                  },
                  {
                    key: "ok",
                    text: "保存",
                    bold: true,
                    onClick: async () => {
                      if (!inputValue || !inputValue.trim()) {
                        Toast.show({ content: "请输入内容" });
                        return;
                      }
                      try {
                        // 调用后端接口保存过敏史
                        const updated = await ElderHealthService.addAllergy(
                          inputValue.trim()
                        );
                        // 更新本地状态
                        setArchive(updated || null);
                        Toast.show({ content: "已保存" });
                        handler.close();

                        // 关闭当前列表对话框
                        if (listHandler) {
                          listHandler.close();
                        }
                      } catch (err: any) {
                        Toast.show({ content: err?.message || "保存失败" });
                      }
                    },
                  },
                ],
              });
            };

            openList();
          }}
        >
          过敏史
        </List.Item>
        <List.Item
          arrow
          onClick={() => {
            let listHandler: any;

            const openList = () => {
              listHandler = Dialog.show({
                title: (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 700 }}>
                      用药时间设置
                    </span>
                    <Button
                      size="small"
                      color="primary"
                      onClick={openAdd}
                      style={{ height: 36, fontSize: 16, padding: "0 14px" }}
                    >
                      添加
                    </Button>
                  </div>
                ),
                content: (
                  <div>
                    {(() => {
                      // 归一化用药数据到 {name, times[]}
                      const raw = (archive?.useMedication || []) as any[];
                      const map = new Map<string, Set<string>>();
                      for (const it of raw) {
                        const nm = (it?.name || "").trim();
                        if (!nm) continue;
                        const set = map.get(nm) || new Set<string>();
                        if (Array.isArray(it?.times))
                          for (const t of it.times) if (t) set.add(String(t));
                        if (it?.time) set.add(String(it.time));
                        map.set(nm, set);
                      }
                      const meds = Array.from(map.entries()).map(([n, s]) => ({
                        name: n,
                        times: Array.from(s).sort(),
                      }));
                      if (meds.length === 0) {
                        return (
                          <div style={{ padding: 12 }}>
                            <Empty description="暂无用药设置" />
                          </div>
                        );
                      }

                      const openEdit = (item: { name: string; times: string[] }) => {
                        let latest = { name: item.name, times: [...item.times] };
                        const Form: React.FC = () => {
                          const [name, setName] = useState<string>(latest.name);
                          const [times, setTimes] = useState<string[]>(latest.times.length ? latest.times : [""]);
                          useEffect(() => {
                            latest = { name, times };
                          }, [name, times]);
                          return (
                            <div style={{ paddingTop: 12 }}>
                              <Space direction="vertical" style={{ width: "100%" }}>
                                <Input
                                  style={{ fontSize: 18, height: 44 }}
                                  placeholder="药品名称"
                                  value={name}
                                  onChange={setName}
                                />
                                <div>
                                  {times.map((t, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                      <input
                                        type="time"
                                        value={t}
                                        style={{ width: "100%", height: 44, fontSize: 18, boxSizing: "border-box", padding: "0 12px" }}
                                        onChange={(e) => {
                                          const arr = [...times];
                                          arr[idx] = e.target.value;
                                          setTimes(arr);
                                        }}
                                      />
                                      <Button
                                        size="small"
                                        color="danger"
                                        onClick={() => setTimes(times.filter((_, i) => i !== idx))}
                                        style={{
                                          width: 44,
                                          height: 44,
                                          borderRadius: 12,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                        aria-label="删除时间"
                                      >
                                        <DeleteOutline style={{ fontSize: 22 }} />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    size="large"
                                    color="primary"
                                    fill="solid"
                                    onClick={() => setTimes([...times, ""])}
                                    style={{ marginTop: 8, width: "100%", height: 48, fontSize: 18 }}
                                  >
                                    + 添加时间
                                  </Button>
                                </div>
                              </Space>
                            </div>
                          );
                        };

                        let handler: any;
                        handler = Dialog.show({
                          title: "修改用药时间",
                          content: <Form />,
                          closeOnMaskClick: false,
                          actions: [
                            { key: "cancel", text: "取消", onClick: () => handler.close() },
                            {
                              key: "ok",
                              text: "保存",
                              bold: true,
                              onClick: async () => {
                                const cleaned = Array.from(new Set(latest.times.map((x) => String(x || "").trim()).filter(Boolean))).sort();
                                if (!latest.name.trim() || cleaned.length === 0) {
                                  Toast.show({ content: "请填写药品名称和至少一个时间" });
                                  return;
                                }
                                try {
                                  if (latest.name.trim() !== item.name) {
                                    await ElderHealthService.deleteMedicationND(item.name);
                                  }
                                  const updated = await ElderHealthService.addMedication(latest.name.trim(), cleaned);
                                  setArchive(updated || null);
                                  Toast.show({ content: "已保存" });
                                  handler.close();
                                  if (listHandler) listHandler.close();
                                } catch (err: any) {
                                  Toast.show({ content: err?.message || "保存失败" });
                                }
                              },
                            },
                          ],
                        });
                      };

                      const onDelete = (item: { name: string }) => {
                        Dialog.confirm({
                          content: `删除“${item.name}”的所有提醒？`,
                          onConfirm: async () => {
                            try {
                              const updated = await ElderHealthService.deleteMedicationND(item.name);
                              setArchive(updated || null);
                              Toast.show({ content: "已删除" });
                              if (listHandler) listHandler.close();
                            } catch (err: any) {
                              Toast.show({ content: err?.message || "删除失败" });
                            }
                          },
                        });
                      };

                      const MedList: React.FC = () => {
                        const [activeKey, setActiveKey] = useState<string | null>(null);
                        const makeHandler = (key: string) => (v: boolean) => setActiveKey(v ? key : null);
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}
                          >
                            {meds.map((u, idx) => {
                              const nameKey = `name-${idx}`;
                              const timeKey = `time-${idx}`;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "8px 0",
                                  }}
                                >
                                  <Popover
                                    content={
                                      <div style={{ padding: 6, maxWidth: 260, wordBreak: "break-all", fontSize: 20 }}>{u.name}</div>
                                    }
                                    trigger="click"
                                    placement="top-start"
                                    visible={activeKey === nameKey}
                                    onVisibleChange={makeHandler(nameKey)}
                                  >
                                    <div
                                      style={{
                                        fontSize: 22,
                                        fontWeight: 600,
                                        flex: 1,
                                        cursor: "pointer",
                                        userSelect: "none",
                                      }}
                                      title={u.name}
                                    >
                                      {u.name.length > 3 ? `${u.name.slice(0, 2)}···` : u.name}
                                    </div>
                                  </Popover>
                                  <Popover
                                    content={
                                      <div style={{ padding: 6, maxWidth: 280, fontSize: 20 }}>
                                        {(u.times || []).length === 0 ? (
                                          <div>暂无时间</div>
                                        ) : (
                                          <div>{(u.times || []).join("、")}</div>
                                        )}
                                      </div>
                                    }
                                    trigger="click"
                                    placement="top"
                                    visible={activeKey === timeKey}
                                    onVisibleChange={makeHandler(timeKey)}
                                  >
                                    <div
                                      style={{
                                        fontSize: 20,
                                        color: "#333",
                                        marginRight: 20,
                                        cursor: "pointer",
                                        userSelect: "none",
                                      }}
                                      title={(u.times || []).join("、")}
                                    >
                                      {(u.times || []).length <= 1
                                        ? (u.times || ["--:--"])[0]
                                        : `共${(u.times || []).length}次`}
                                    </div>
                                  </Popover>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <Button
                                      size="small"
                                      color="primary"
                                      fill="outline"
                                      onClick={() => openEdit(u)}
                                      style={{ height: 36, padding: "0 14px", fontSize: 16, borderRadius: 18 }}
                                    >
                                      修改
                                    </Button>
                                    <Button
                                      size="small"
                                      color="danger"
                                      onClick={() => onDelete(u)}
                                      style={{ height: 36, padding: "0 14px", fontSize: 16, borderRadius: 18 }}
                                    >
                                      删除
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      };

                      return <MedList />;
                    })()}
                  </div>
                ),
                closeOnMaskClick: true,
                style: { "--min-width": "86vw", "--max-width": "92vw" } as any,
              });
            };

            const openAdd = () => {
              let latest = { name: "", times: [""] as string[] };
              const Form: React.FC = () => {
                const [name, setName] = useState<string>("");
                const [times, setTimes] = useState<string[]>([""]);
                useEffect(() => {
                  latest = { name, times };
                }, [name, times]);
                return (
                  <div style={{ paddingTop: 12 }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Input
                        style={{ fontSize: 18, height: 44 }}
                        placeholder="药品名称"
                        value={name}
                        onChange={setName}
                      />
                      <div>
                        {times.map((t, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                            <input
                              type="time"
                              value={t}
                              style={{ width: "100%", height: 44, fontSize: 18, boxSizing: "border-box", padding: "0 12px" }}
                              onChange={(e) => {
                                const arr = [...times];
                                arr[idx] = e.target.value;
                                setTimes(arr);
                              }}
                            />
                            <Button
                              size="small"
                              color="danger"
                              onClick={() => setTimes(times.filter((_, i) => i !== idx))}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              aria-label="删除时间"
                            >
                              <DeleteOutline style={{ fontSize: 22 }} />
                            </Button>
                          </div>
                        ))}
                        <Button size="large" color="primary" fill="solid" onClick={() => setTimes([...times, ""])} style={{ marginTop: 8, width: "100%", height: 48, fontSize: 18 }}>
                          + 添加时间
                        </Button>
                      </div>
                    </Space>
                  </div>
                );
              };

              let handler: any;
              handler = Dialog.show({
                title: "添加用药时间",
                content: <Form />,
                closeOnMaskClick: false,
                actions: [
                  {
                    key: "cancel",
                    text: "取消",
                    onClick: () => {
                      Toast.show({ content: "已取消" });
                      handler.close();
                    },
                  },
                  {
                    key: "ok",
                    text: "保存",
                    bold: true,
                    onClick: async () => {
                      const cleaned = Array.from(new Set(latest.times.map((x) => String(x || "").trim()).filter(Boolean))).sort();
                      if (!latest.name.trim() || cleaned.length === 0) {
                        Toast.show({ content: "请填写药品名称和至少一个时间" });
                        return;
                      }
                      try {
                        const updated = await ElderHealthService.addMedication(
                          latest.name.trim(),
                          cleaned
                        );
                        setArchive(updated || null);
                        Toast.show({ content: "已保存" });
                        handler.close();
                        if (listHandler) {
                          listHandler.close();
                        }
                      } catch (err: any) {
                        Toast.show({ content: err?.message || "保存失败" });
                      }
                    },
                  },
                ],
              });
            };

            openList();
          }}
        >
          用药时间设置
        </List.Item>
      </List>
    );
  }, [archive]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data = await ElderHealthService.getMyArchive();
        if (!data) {
          // 若不存在则初始化档案
          const created = await ElderHealthService.initArchive();
          data = created;
          Toast.show({
            content: "未找到健康档案，已自动为您创建",
            icon: "success",
          });
        }
        setArchive(data || null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <NavBal title="健康档案" />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, padding: 8 }}>
          {content}
        </div>
      )}
    </div>
  );
};

export default Health;
