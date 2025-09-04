import React from "react";
import { useNavigate } from "react-router-dom";
import { LeftOutline } from "antd-mobile-icons";

export default function NavBal(props: { title: string }) {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: "1.2rem" }}>
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          height: "1.2rem",
          background: "#F5B886",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          borderBottom: "1px solid #F5B886",
        }}
      >
        <div
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: "0.3rem",
            display: "flex",
            alignItems: "center",
            color: "#fff",
            fontSize: "0.48rem",
            cursor: "pointer",
          }}
        >
          <LeftOutline />
          <span style={{ marginLeft: "0.12rem", fontSize: "0.36rem" }}>
            返回
          </span>
        </div>
        <span style={{ color: "#fff", fontSize: "0.42rem", fontWeight: 700 }}>
          {props.title}
        </span>
      </div>
    </div>
  );
}
