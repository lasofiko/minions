import logging

def make_logger() -> logging.Logger:
    """
    Создаёт и возвращает объект логгера.
    Возвращает:
        logger: объект логгера.
    """
    # создание логгера
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    # добавление обработчика файлового лога
    if not logger.handlers:
        fh = logging.FileHandler("../shell.log", encoding="utf-8") # запись будет вестись в файл shell.log
        fmt = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S") # формат записи лога
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    return logger

