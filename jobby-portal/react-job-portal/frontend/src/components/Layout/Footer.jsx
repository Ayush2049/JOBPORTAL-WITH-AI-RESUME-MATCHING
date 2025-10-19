import React, { useContext } from "react";
import { Context } from "../../main";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { RiInstagramFill } from "react-icons/ri";
function Footer() {
  const { isAuthorized } = useContext(Context);
  return (
    <footer className={isAuthorized ? "footerShow" : "footerHide"}>
      <div>&copy; All Rights Reserved by Ayush.</div>
      <div>
        <Link to={"https://github.com/Ayush2049"} target="github">
          <FaGithub></FaGithub>
        </Link>
        <Link to={"https://leetcode.com/u/ayush_codes/"} target="leetcode">
          <SiLeetcode></SiLeetcode>
        </Link>
        <Link
          to={"https://in.linkedin.com/in/ayush-sharma-8805842ba  "}
          target="linkedin"
        >
          <FaLinkedin></FaLinkedin>
        </Link>
        <Link to={"https://www.instagram.com/ayush_sharma/"} target="instagram">
          <RiInstagramFill></RiInstagramFill>
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
