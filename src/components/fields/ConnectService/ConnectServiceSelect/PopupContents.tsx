import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useDebouncedCallback } from "use-debounce";
import { get } from "lodash-es";
import { getDoc } from "firebase/firestore";

import {
  Button,
  Checkbox,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  Radio,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import { IConnectServiceSelectProps } from ".";
import useStyles from "./styles";
import Loading from "@src/components/Loading";

export interface IPopupContentsProps
  extends Omit<IConnectServiceSelectProps, "className" | "TextFieldProps"> {}

// TODO: Implement infinite scroll here
export default function PopupContents({
  value = [],
  onChange,
  config,
  docRef,
}: IPopupContentsProps) {
  const url = config.url;
  const titleKey = config.titleKey ?? config.primaryKey;
  const subtitleKey = config.subtitleKey;
  const resultsKey = config.resultsKey;
  const primaryKey = config.primaryKey;
  const multiple = Boolean(config.multiple);

  const { classes } = useStyles();

  // Webservice search query
  const [query, setQuery] = useState("");
  // Webservice response
  const [response, setResponse] = useState<any | null>(null);

  const [docData, setDocData] = useState<any | null>(null);
  useEffect(() => {
    // TODO: GENERALIZE
    getDoc(docRef).then((d) => setDocData(d.data()));
  }, []);

  const hits: any["hits"] = get(response, resultsKey) ?? [];
  const search = useDebouncedCallback(
    async (query: string) => {
      if (!docData) return;
      if (!url) return;
      console.log(docData)
      const uri = new URL(url);
      const params: any = { q: query };
      Object.keys(params).forEach((key) =>
        uri.searchParams.append(key, params[key])
      );

      const resp = await fetch(uri.toString(), {
        method: "POST",
        body: JSON.stringify(docData),
        headers: { "content-type": "application/json" },
      });

      const jsonBody = await resp.json();
      setResponse(jsonBody);
    },
    1000,
    { leading: true }
  );

  useEffect(() => {
    search(query);
  }, [query, docData]);

  if (!response) return <Loading />;

  const select = (hit: any) => () => {
    if (multiple) onChange([...value, hit]);
    else onChange([hit]);
  };
  const deselect = (hit: any) => () => {
    if (multiple)
      onChange(value.filter((v) => v[primaryKey] !== hit[primaryKey]));
    else onChange([]);
  };

  const selectedValues = value?.map((item) => get(item, primaryKey));

  const clearSelection = () => onChange([]);

  return (
    <Grid container direction="column" className={classes.grid}>
      <Grid item className={classes.searchRow}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          variant="filled"
          margin="dense"
          label="Search items"
          className={classes.noMargins}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </Grid>

      <Grid item xs className={classes.listRow}>
        <List className={classes.list}>
          {hits.map((hit: any) => {
            const isSelected =
              selectedValues.indexOf(get(hit, primaryKey)) !== -1;
            return (
              <React.Fragment key={get(hit, primaryKey)}>
                <MenuItem
                  dense
                  onClick={isSelected ? deselect(hit) : select(hit)}
                >
                  <ListItemIcon className={classes.checkboxContainer}>
                    {multiple ? (
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        color="secondary"
                        className={classes.checkbox}
                        disableRipple
                        inputProps={{
                          "aria-labelledby": `label-${get(hit, primaryKey)}`,
                        }}
                      />
                    ) : (
                      <Radio
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        color="secondary"
                        className={classes.checkbox}
                        disableRipple
                        inputProps={{
                          "aria-labelledby": `label-${get(hit, primaryKey)}`,
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    id={`label-${get(hit, primaryKey)}`}
                    primary={get(hit, titleKey)}
                    secondary={!subtitleKey ? "" : get(hit, subtitleKey)}
                  />
                </MenuItem>
                <Divider className={classes.divider} />
              </React.Fragment>
            );
          })}
        </List>
      </Grid>

      {multiple && (
        <Grid item className={clsx(classes.footerRow, classes.selectedRow)}>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="button"
              color="textSecondary"
              className={classes.selectedNum}
            >
              {value?.length} of {hits?.length}
            </Typography>

            <Button
              disabled={!value || value.length === 0}
              onClick={clearSelection}
              color="primary"
              className={classes.selectAllButton}
            >
              Clear selection
            </Button>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}
