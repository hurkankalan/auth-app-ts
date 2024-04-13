import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { comparePassword } from "../utils/comparePassword";
import { hashPassword } from "../utils/hashPassword";
import usersModels from "../models/users.model";
import { Users } from "../types/users.type";

const usersControllers = {
  async allUsers(req: Request, res: Response): Promise<Response<Users>> {
    try {
      const users = await usersModels.getAllUsers();

      return res.status(200).json(users.rows);
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  async userById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) return res.status(400).json("Id is required");

    try {
      const user = await usersModels.getUserById(parseInt(id));

      if (!user.rows[0]) {
        return res.status(404).json("User not found");
      }

      return res.status(200).json(user.rows);
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  async userByEmail(req: Request, res: Response): Promise<Response> {
    const { email } = req.params;

    if (!email) return res.status(400).json("Email is required");

    try {
      const user = await usersModels.getUserByEmail(email);

      if (!user.rows[0]) {
        return res.status(404).json("User not found");
      }

      return res.status(200).json(user.rows);
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  async updateUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { email, password, role } = req.body;

    if (!id) {
      return res.status(400).json("Id is required");
    }

    try {
      const oldUserInfos = await usersModels.getUserById(parseInt(id));

      if (!oldUserInfos.rows[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      if (
        email === oldUserInfos.rows[0].email &&
        password === oldUserInfos.rows[0].password &&
        role === oldUserInfos.rows[0].role
      ) {
        return res.status(304).json("No changes detected, user not updated");
      }

      const newUserInfos = {
        email:
          oldUserInfos.rows[0].email !== email
            ? email
            : oldUserInfos.rows[0].email,
        password:
          oldUserInfos.rows[0].password !== password
            ? password
            : oldUserInfos.rows[0].password,
        role:
          oldUserInfos.rows[0].role !== role ? role : oldUserInfos.rows[0].role,
      };

      const newUser = await usersModels.updateUser(
        parseInt(id),
        newUserInfos.email,
        newUserInfos.password,
        newUserInfos.role
      );

      if (newUser.rowCount === 0) {
        return res.status(500).json("User isn't updated");
      }

      return res.status(201).json(newUser.rows);
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  async deleteUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) return res.status(400).json("Id is required");

    try {
      const checkUserIsExist = await usersModels.getUserById(parseInt(id));

      if (!checkUserIsExist.rows[0]) {
        return res.status(404).json("User not found");
      }

      const deleteUser = await usersModels.deleteUser(parseInt(id));

      if (deleteUser.rowCount === 0) {
        return res.status(500).json("User isn't deleted");
      }

      return res.sendStatus(204);
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  async register(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    for (const key in req.body) {
      if (!req.body[key]) {
        res
          .status(400)
          .json({ error: "One or more data are missing in the body" });
      }
    }

    try {
      const user = await usersModels.getUserByEmail(email);

      if (user.rows[0]) {
        return res.status(409).json("User already exists");
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await usersModels.createUser(email, hashedPassword);

      if (newUser.rowCount === 0) {
        return res.status(500).json("User isn't created");
      }

      return res.sendStatus(201);
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    for (const key in req.body) {
      if (!req.body[key]) {
        res
          .status(400)
          .json({ error: "One or more data are missing in the body" });
      }
    }

    try {
      const user = await usersModels.getUserByEmail(email);

      if (!user.rows[0]) {
        return res.status(404).json("User not found");
      }

      const passwordIsValid = await comparePassword(
        password,
        user.rows[0].password
      );

      if (!passwordIsValid) {
        return res.status(401).json("Password is incorrect");
      }

      if (!process.env.JWT_SECRET) {
        return res.status(404).json({ error: "JWT_SECRET is missing" });
      }

      const token = jwt.sign(
        { id: user.rows[0].id, email: user.rows[0].email },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      return res.status(200).json(token);
    } catch (error) {
      return res.status(500).json(error);
    }
  },
};

export default usersControllers;