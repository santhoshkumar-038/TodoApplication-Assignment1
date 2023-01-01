const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let database;

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

//API 1
//SC-1 list of all todos whose status is 'TO DO'
//SC-2 list of all todos whose priority is 'HIGH'
//SC-3 list of all todos whose priority 'HIGH' & status 'IN PROGRESS'
//SC-4 list of all todos whose todo contains 'Buy' text
//SC-5 list of all todos whose category 'WORK' & status 'DONE'
//SC-6 list of all todos whose category is 'HOME'
//SC-7 list of all todos whose category 'LEARNING' & priority 'HIGH'

const statusPropertyQuery = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const priorityPropertyQuery = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const priorityAndStatusQuery = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const todoPropertyQuery = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const categoryAndStatusQuery = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const categoryPropertyQuery = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const categoryAndPriorityQuery = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data;
  let getTodoQuery;
  const { search_q = "", category, status, priority } = request.query;
  console.log(statusPropertyQuery(request.query));
  switch (true) {
    case statusPropertyQuery(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `SELECT * FROM todo WHERE status LIKE '%${status}%';`;
        data = await database.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priorityPropertyQuery(request.query):
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        getTodoQuery = `SELECT * FROM todo WHERE priority LIKE '%${priority}%';`;
        data = await database.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case priorityAndStatusQuery(request.query):
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE 
                priority LIKE '%${priority}%' AND status LIKE '%${status}%';`;
          data = await database.all(getTodoQuery);
          response.send(
            data.map((eachItem) => convertToResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case todoPropertyQuery(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(getTodoQuery);
      response.send(data.map((eachItem) => convertToResponseObject(eachItem)));
      break;
    case categoryAndStatusQuery(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE 
                category LIKE '%${category}%' AND status LIKE '%${status}%';`;
          data = await database.all(getTodoQuery);
          response.send(
            data.map((eachItem) => convertToResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryPropertyQuery(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE category LIKE '%${category}%';`;
        data = await database.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndPriorityQuery(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "LOW" ||
          priority === "MEDIUM" ||
          priority === "HIGH"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE 
                category LIKE '%${category}%' AND priority LIKE '%${priority}%';`;
          data = await database.all(getTodoQuery);
          response.send(
            data.map((eachItem) => convertToResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo;`;
      data = await database.all(getTodoQuery);
      response.send(data.map((eachItem) => convertToResponseObject(eachItem)));
      break;
  }
});

//API 2 Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const todoResponse = await database.get(getTodoQuery);
  response.send(convertToResponseObject(todoResponse));
});

//API 3 list of all todos with specific due date in query parameter
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const dateRequestQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const dateResponse = await database.all(dateRequestQuery);
    console.log(dateResponse);
    response.send(
      dateResponse.map((eachItem) => convertToResponseObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4 Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO todo 
                    (id, todo, category,priority, status, due_date) VALUES
                    (${id}, '${todo}', '${category}','${priority}', 
                    '${status}', '${postNewDueDate}');`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5 Update the details of a specific todo based on todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.dueDate,
    category = previousTodo.category,
  } = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET 
          todo='${todo}', priority='${priority}', status='${status}', category='${category}',
          due_date='${dueDate}' WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `UPDATE todo SET 
          todo='${todo}', priority='${priority}', status='${status}', category='${category}',
          due_date='${dueDate}' WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      updateTodoQuery = `UPDATE todo SET 
      todo='${todo}', priority='${priority}', status='${status}', category='${category}',
      due_date='${dueDate}' WHERE id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET 
          todo='${todo}', priority='${priority}', status='${status}', category='${category}',
          due_date='${dueDate}' WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET 
        todo='${todo}', priority='${priority}', status='${status}', category='${category}',
        due_date='${newDueDate}' WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid ${updateColumn}`);
      }
      break;
  }
  //   const updateTodoQuery = `UPDATE todo SET
  //     todo='${todo}', priority='${priority}', status='${status}'
  //     WHERE id = ${todoId};`;
  //   await database.run(updateTodoQuery);
  //   response.send(`${updateColumn} Updated`);
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
