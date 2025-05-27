from psycopg import AsyncConnection, sql

from backend.data.secret import db_host


class Database:
    async def init(self):
        self.conn = await AsyncConnection.connect(db_host)

        async with self.conn.cursor() as cursor:
            await cursor.execute("SELECT COALESCE(MAX(id), 0) FROM hands;")
            row = await cursor.fetchone()
            self.hand_id = row[0] + 1

        await self.create_tables()

    async def create_table(self, table_name: str, columns: dict[str, str]):
        async with self.conn.cursor() as cursor:
            await cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS %s (
                    {",\n".join("%s %s" for _ in columns)}
                );
                """
                % (table_name, *[typ for item in columns.items() for typ in item]),
            )

        await self.conn.commit()

    async def drop_table(self, table_name):
        async with self.conn.cursor() as cursor:
            await cursor.execute(
                """
                DROP TABLE IF EXISTS %s;
                """
                % (table_name),
            )

        await self.conn.commit()

    async def recreate_table(self, table_name, columns):
        await self.drop_table(table_name)
        await self.create_table(table_name, columns)

    async def create_tables(self):
        await self.recreate_table(
            "hands",
            {
                "id": "INT",
                "userid": "TEXT",
                "date": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
                "tablecards": "TEXT[5]",
                "hand": "TEXT[2]",
                "won": "BOOL",
                "stack": "INT",
                "pot": "INT",
                "bet": "INT",
                "position": "INT",
                "players": "TEXT[]",
            },
        )

    async def insert_data(self, table_name, data):
        query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
            sql.Identifier(table_name),
            sql.SQL(", ").join(map(sql.Identifier, data.keys())),
            sql.SQL(", ").join(sql.Placeholder() * len(data)),
        )

        async with self.conn.cursor() as cursor:
            await cursor.execute(query, list(data.values()))
            await self.conn.commit()

    async def get_data(self, command):
        async with self.conn.cursor() as cursor:
            await cursor.execute(command)
            return await cursor.fetchall()
