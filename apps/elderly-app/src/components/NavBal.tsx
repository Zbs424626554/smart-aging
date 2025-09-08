import React from "react";
import { useNavigate } from "react-router-dom";
import { LeftOutline } from "antd-mobile-icons";

export const NavBal = (props: { title: string; hideBack?: boolean }) => {
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
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          borderBottom: "1px solid #eaeaea",
        }}
      >
        {!props.hideBack && (
          <div
            onClick={() => navigate(-1)}
            style={{
              position: "absolute",
              left: "0.3rem",
              display: "flex",
              alignItems: "center",
              color: "#222",
              fontSize: "0.48rem",
              cursor: "pointer",
            }}
          >
            <LeftOutline />
            <span style={{ marginLeft: "0.12rem", fontSize: "0.36rem" }}>
              返回
            </span>
          </div>
        )}
        <span style={{ color: "#222", fontSize: "calc(0.50rem)", fontWeight: 700 }}>
          {props.title}
        </span>
      </div>
    </div>
  );
};

export default NavBal;
